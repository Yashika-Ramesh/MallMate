
package com.yashika.mallmate.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;

import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;

@Entity
@Getter
@Setter
@NoArgsConstructor
public class Tenant {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String businessName;

    private String contactPerson;

    private String email;

    private String phone;

    private String leaseStartDate;

    private String leaseEndDate;

    private Double monthlyRent;

    @OneToOne
    @JoinColumn(name = "shop_id", unique = true)
    private Shop shop;
}
