package com.ats.backendats.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebMvcConfig implements WebMvcConfigurer {

    private final RateLimitInterceptor rateLimitInterceptor;
    private final LoggingInterceptor loggingInterceptor;

    public WebMvcConfig(RateLimitInterceptor rateLimitInterceptor, LoggingInterceptor loggingInterceptor) {
        this.rateLimitInterceptor = rateLimitInterceptor;
        this.loggingInterceptor = loggingInterceptor;
    }

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        // Enregistrer le Logging Interceptor pour toutes les requêtes API
        registry.addInterceptor(loggingInterceptor)
                .addPathPatterns("/api/**");
                
        // Enregistrer le Rate Limit Interceptor pour toutes les requêtes API
        registry.addInterceptor(rateLimitInterceptor)
                .addPathPatterns("/api/**");
    }
}
