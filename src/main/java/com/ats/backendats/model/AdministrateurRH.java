package com.ats.backendats.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

@Entity
@Table(name = "administrateurs_rh")
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
public class AdministrateurRH extends Utilisateur {

    @Column(name = "date_nomination")
    private LocalDate dateNomination;
}