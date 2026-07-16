package com.ats.backendats.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class DashboardStatsResponse {
    private long totalCandidats;
    private long totalCandidatures;
    private long totalPostes;
    private long postesActifs;
    private long candidaturesEnAttente;
    private double scoreMoyenAnalyse;
    private long candidaturesAcceptees;
    private long candidaturesRejetees;
}