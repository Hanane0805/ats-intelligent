package com.ats.backendats.config;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import java.util.Map;
import java.util.Queue;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentLinkedQueue;

@Component
public class RateLimitInterceptor implements HandlerInterceptor {

    private final Map<String, Queue<Long>> requestCounts = new ConcurrentHashMap<>();
    
    // Config: 100 requests per 1 minute (60000ms)
    private static final int MAX_REQUESTS = 100;
    private static final long TIME_WINDOW_MS = 60000;

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        String ipAddress = request.getHeader("X-Forwarded-For");
        if (ipAddress == null || ipAddress.isEmpty() || "unknown".equalsIgnoreCase(ipAddress)) {
            ipAddress = request.getRemoteAddr();
        }

        long currentTime = System.currentTimeMillis();
        
        requestCounts.putIfAbsent(ipAddress, new ConcurrentLinkedQueue<>());
        Queue<Long> requests = requestCounts.get(ipAddress);

        // Remove old requests outside the time window
        while (!requests.isEmpty() && (currentTime - requests.peek() > TIME_WINDOW_MS)) {
            requests.poll();
        }

        if (requests.size() >= MAX_REQUESTS) {
            response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
            response.getWriter().write("Too Many Requests - Rate limit exceeded. Please try again later.");
            return false;
        }

        requests.offer(currentTime);
        return true;
    }
}
