package com.example.gestionale.controllers;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class GestionaleController {

    @GetMapping("/")
    public String dio(){
        return "DIO BOOONNOOOOOOO";
    }
}
