package com.ats.backendats.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Data
@Component
@ConfigurationProperties(prefix = "n8n")
public class N8nProperties {

    private boolean enabled = false;
    private String apiKey;
    private Webhooks webhooks = new Webhooks();

    @Data
    public static class Webhooks {
        private String candidatureCreated;
        private String candidatureUpdated;
    }
}
