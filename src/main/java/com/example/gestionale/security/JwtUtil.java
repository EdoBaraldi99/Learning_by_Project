package com.example.gestionale.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.util.Date;
import java.util.function.Function;

@Component
public class JwtUtil {

    private final SecretKey secretKey;

    public JwtUtil(@Value("${jwt.secret}") String jwtSecret) {
        this.secretKey = Keys.hmacShaKeyFor(jwtSecret.getBytes());
    }

    private static final long SCADENZA_MS = 1000 * 60 * 60 * 8; // 8 ore

    public String generaToken(UserDetails userDetails) {
        return Jwts.builder()
                .subject(userDetails.getUsername())
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + SCADENZA_MS))
                .signWith(secretKey)
                .compact();
    }

    public String estraiEmail(String token) {
        return estraiClaim(token, Claims::getSubject);
    }

    public boolean isTokenValido(String token, UserDetails userDetails) {
        String email = estraiEmail(token);
        return email.equals(userDetails.getUsername()) && !isTokenScaduto(token);
    }

    private boolean isTokenScaduto(String token) {
        return estraiClaim(token, Claims::getExpiration).before(new Date());
    }

    private <T> T estraiClaim(String token, Function<Claims, T> resolver) {
        Claims claims = Jwts.parser().verifyWith(secretKey).build()
                .parseSignedClaims(token).getPayload();
        return resolver.apply(claims);
    }
}
