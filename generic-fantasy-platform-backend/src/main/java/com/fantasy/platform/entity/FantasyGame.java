package com.fantasy.platform.entity;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.ToString;

import java.util.ArrayList;
import java.util.List;

@Data
@NoArgsConstructor
@Entity
@Table(name = "domains")
public class FantasyGame {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "field_rows", nullable = false, columnDefinition = "INTEGER DEFAULT 10")
    private Integer fieldRows = 10;

    @Column(name = "field_cols", nullable = false, columnDefinition = "INTEGER DEFAULT 10")
    private Integer fieldCols = 10;

    @Column(name = "bench_rows")
    private Integer benchRows;

    @Column(name = "bench_cols")
    private Integer benchCols;

    @Column(name = "pick_field_rows")
    private Integer pickFieldRows;

    @Column(name = "pick_field_cols")
    private Integer pickFieldCols;

    @Column(name = "pick_bench_rows")
    private Integer pickBenchRows;

    @Column(name = "pick_bench_cols")
    private Integer pickBenchCols;

    @Column(name = "budget")
    private Double budget;

    @Column(name = "background_image_url")
    private String backgroundImageUrl;

    @Column(name = "thumbnail_url")
    private String thumbnailUrl;

    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    @OneToMany(mappedBy = "fantasyGame", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ScoringRule> scoringRules = new ArrayList<>();

    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    @OneToMany(mappedBy = "fantasyGame", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<FantasyGamePosition> positions = new ArrayList<>();

    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    @OneToMany(mappedBy = "fantasyGame", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<FantasyGamePickPosition> pickPositions = new ArrayList<>();

    @ToString.Exclude
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by_id", nullable = false)
    private User createdBy;

    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    @OneToMany(mappedBy = "fantasyGame", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<League> leagues = new ArrayList<>();

    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    @OneToMany(mappedBy = "fantasyGame", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Player> players = new ArrayList<>();

    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    @OneToMany(mappedBy = "fantasyGame", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Round> rounds = new ArrayList<>();
}
