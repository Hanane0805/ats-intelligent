package com.ats.backendats.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "recruteurs_rh")
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
public class RecruteurRH extends Utilisateur {

    @Column(name = "departement")
    private String departement;
}