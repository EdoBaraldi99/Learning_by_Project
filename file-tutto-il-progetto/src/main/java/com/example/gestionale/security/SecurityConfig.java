package com.example.gestionale.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    private final JwtAuthFilter jwtAuthFilter;
    private final DipendenteDetailsService dipendenteDetailsService;

    public SecurityConfig(JwtAuthFilter jwtAuthFilter, DipendenteDetailsService dipendenteDetailsService) {
        this.jwtAuthFilter = jwtAuthFilter;
        this.dipendenteDetailsService = dipendenteDetailsService;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public DaoAuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider provider = new DaoAuthenticationProvider(dipendenteDetailsService);
        provider.setPasswordEncoder(passwordEncoder());
        return provider;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf.disable()) // disabilitato perché usiamo JWT stateless, non sessioni/cookie
                .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/auth/**").permitAll() // login e registrazione pubblici
                        // frontend statico (html/css/js in src/main/resources/static): deve essere
                        // raggiungibile senza autenticazione, altrimenti non si può nemmeno caricare
                        // login.html per ottenere il token
                        .requestMatchers(HttpMethod.GET, "/", "/*.html", "/*.css", "/*.js").permitAll()
                        // lettura: chiunque sia autenticato
                        .requestMatchers(HttpMethod.GET, "/progetti/**").authenticated()
                        .requestMatchers(HttpMethod.GET, "/attivita/**").authenticated()
                        .requestMatchers(HttpMethod.GET, "/assegnati/**").authenticated()
                        .requestMatchers(HttpMethod.GET, "/associati/**").authenticated()
                        .requestMatchers(HttpMethod.GET, "/storici/**").authenticated()

                        .requestMatchers("/attivita/**").authenticated()
                        .requestMatchers("/assegnati/**").authenticated()
                        // scrittura su /associati/** è aperta a chiunque sia autenticato: la
                        // restrizione fine (ADMIN o capoprogetto del progetto) è demandata alle
                        // @PreAuthorize di AssociatoController, come già avviene per attivita/assegnati
                        .requestMatchers("/associati/**").authenticated()

                        .requestMatchers(HttpMethod.POST, "/progetti/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.PATCH, "/progetti/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/progetti/**").hasRole("ADMIN")

                        // gestione admin sui dipendenti: solo admin
                        .requestMatchers("/dipendenti/*/ruolo-admin").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/dipendenti/**").hasRole("ADMIN")

                        .anyRequest().authenticated()
                )
                .authenticationProvider(authenticationProvider())
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
