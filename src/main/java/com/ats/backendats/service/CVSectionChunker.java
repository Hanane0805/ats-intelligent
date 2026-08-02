package com.ats.backendats.service;

import java.util.*;
import java.util.regex.*;
import org.springframework.stereotype.Component;

/**
 * CVSectionChunker - Chunking intelligent specifique aux CV
 */
@Component
public class CVSectionChunker {

    private static final Map<String, List<Pattern>> SECTION_PATTERNS = new LinkedHashMap<>();

    static {
        SECTION_PATTERNS.put("PROFILE", List.of(
                Pattern.compile("^(?:profil|profile|resume|resumé|résumé|summary|about\\s*me|objectif|objective)\\s*[:\\-]?\\s*.*$", Pattern.CASE_INSENSITIVE | Pattern.MULTILINE),
                Pattern.compile("^(?:a\\s*propos|about)\\s*[:\\-]?\\s*.*$", Pattern.CASE_INSENSITIVE | Pattern.MULTILINE)
        ));

        SECTION_PATTERNS.put("EXPERIENCE", List.of(
                Pattern.compile("^(?:experience(?:s)?\\s*professionnelle(?:s)?|expérience(?:s)?\\s*professionnelle(?:s)?|parcours\\s*professionnel|work\\s*experience|emploi(?:s)?|career|travail)\\s*[:\\-]?\\s*.*$", Pattern.CASE_INSENSITIVE | Pattern.MULTILINE),
                Pattern.compile("^(?:experiences|expériences)\\s*[:\\-]?\\s*.*$", Pattern.CASE_INSENSITIVE | Pattern.MULTILINE)
        ));

        SECTION_PATTERNS.put("FORMATION", List.of(
                Pattern.compile("^(?:formation(?:s)?|education|diplome(?:s)?|diplôme(?:s)?|etudes|études|academic|parcours\\s*academique|parcours\\s*académique|scolarite|scolarité|qualification(?:s)?)\\s*[:\\-]?\\s*.*$", Pattern.CASE_INSENSITIVE | Pattern.MULTILINE)
        ));

        SECTION_PATTERNS.put("SKILLS", List.of(
                Pattern.compile("^(?:competence(?:s)?|compétence(?:s)?|skills|technologies|hard\\s*skills|soft\\s*skills|outils|tools|technique(?:s)?|savoir\\s*faire)\\s*[:\\-]?\\s*.*$", Pattern.CASE_INSENSITIVE | Pattern.MULTILINE)
        ));

        SECTION_PATTERNS.put("LANGUES", List.of(
                Pattern.compile("^(?:langue(?:s)?|language(?:s)?|langues\\s*etrangeres|langues\\s*étrangères)\\s*[:\\-]?\\s*.*$", Pattern.CASE_INSENSITIVE | Pattern.MULTILINE)
        ));

        SECTION_PATTERNS.put("PROJETS", List.of(
                Pattern.compile("^(?:projet(?:s)?|projects?|realisations|réalisations|portfolio)\\s*[:\\-]?\\s*.*$", Pattern.CASE_INSENSITIVE | Pattern.MULTILINE)
        ));

        SECTION_PATTERNS.put("CERTIFICATIONS", List.of(
                Pattern.compile("^(?:certification(?:s)?|certificat(?:s)?|certified|badges?)\\s*[:\\-]?\\s*.*$", Pattern.CASE_INSENSITIVE | Pattern.MULTILINE)
        ));

        SECTION_PATTERNS.put("INTERETS", List.of(
                Pattern.compile("^(?:centres?\\s*d'interet|centres?\\s*d'intérêt|interets|intérêts|hobbies?|interests?|loisirs|activites|activités)\\s*[:\\-]?\\s*.*$", Pattern.CASE_INSENSITIVE | Pattern.MULTILINE)
        ));
    }

    private final int maxChunkSize;

    public CVSectionChunker() {
        this(800);
    }

    public CVSectionChunker(int maxChunkSize) {
        this.maxChunkSize = maxChunkSize;
    }

    public List<CVChunk> chunk(String cvText) {
        if (cvText == null || cvText.isBlank()) {
            return new ArrayList<>();
        }

        cvText = cleanText(cvText);
        List<SectionBoundary> boundaries = findSectionBoundaries(cvText);

        if (boundaries.isEmpty()) {
            System.out.println("[RAG-CVChunker] Aucune section reconnue, decoupage generique");
            return fallbackSplit(cvText);
        }

        List<CVChunk> chunks = new ArrayList<>();

        for (int i = 0; i < boundaries.size(); i++) {
            SectionBoundary current = boundaries.get(i);
            int start = current.endOffset();
            int end = (i + 1 < boundaries.size())
                    ? boundaries.get(i + 1).startOffset()
                    : cvText.length();

            String content = cvText.substring(start, end).trim();

            if (content.length() > maxChunkSize) {
                List<String> subChunks = splitLongSection(content, maxChunkSize);
                for (int j = 0; j < subChunks.size(); j++) {
                    chunks.add(new CVChunk(current.sectionType(), subChunks.get(j), j));
                }
            } else if (content.length() > 20) {
                chunks.add(new CVChunk(current.sectionType(), content, 0));
            }
        }

        if (!boundaries.isEmpty() && boundaries.get(0).startOffset() > 20) {
            String header = cvText.substring(0, boundaries.get(0).startOffset()).trim();
            if (header.length() > 20) {
                chunks.add(0, new CVChunk("HEADER", header, 0));
            }
        }

        System.out.println("[RAG-CVChunker] CV decoupe en " + chunks.size() + " sections:");
        for (CVChunk c : chunks) {
            System.out.println("  [" + c.type() + "] " + c.content().substring(0, Math.min(60, c.content().length())) + "...");
        }

        return chunks;
    }

    private List<SectionBoundary> findSectionBoundaries(String text) {
        List<SectionBoundary> boundaries = new ArrayList<>();

        for (Map.Entry<String, List<Pattern>> entry : SECTION_PATTERNS.entrySet()) {
            String sectionType = entry.getKey();
            for (Pattern pattern : entry.getValue()) {
                Matcher matcher = pattern.matcher(text);
                while (matcher.find()) {
                    boundaries.add(new SectionBoundary(sectionType, matcher.start(), matcher.end()));
                }
            }
        }

        boundaries.sort(Comparator.comparingInt(SectionBoundary::startOffset));

        List<SectionBoundary> filtered = new ArrayList<>();
        int lastEnd = 0;
        for (SectionBoundary b : boundaries) {
            if (b.startOffset() >= lastEnd) {
                filtered.add(b);
                lastEnd = b.endOffset();
            }
        }

        return filtered;
    }

    private List<String> splitLongSection(String content, int maxSize) {
        List<String> chunks = new ArrayList<>();
        String[] sentences = content.split("(?<=[.!?])\\s+");

        StringBuilder current = new StringBuilder();
        for (String sentence : sentences) {
            if (current.length() + sentence.length() > maxSize && current.length() > 0) {
                chunks.add(current.toString().trim());
                current = new StringBuilder();
            }
            current.append(sentence).append(" ");
        }
        if (current.length() > 20) {
            chunks.add(current.toString().trim());
        }
        return chunks;
    }

    private List<CVChunk> fallbackSplit(String text) {
        List<CVChunk> chunks = new ArrayList<>();
        int size = 500;
        for (int i = 0; i < text.length(); i += size) {
            String chunk = text.substring(i, Math.min(i + size, text.length()));
            chunks.add(new CVChunk("GENERAL", chunk, i / size));
        }
        return chunks;
    }

    private String cleanText(String text) {
        text = text.replaceAll("[\\t]+", " ");
        text = text.replaceAll("(\\r\\n|\\n)\\s+(\\r\\n|\\n)", "$1$2");
        text = text.replaceAll(" +", " ");
        return text.trim();
    }

    public record CVChunk(
            String type,
            String content,
            int subIndex
    ) {
        public String toEmbeddingText() {
            return "[Section: " + type + "] " + content;
        }
    }

    private record SectionBoundary(
            String sectionType,
            int startOffset,
            int endOffset
    ) {}
}