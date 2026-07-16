package com.ats.backendats.repository;

import com.ats.backendats.model.CVChunk;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface CVChunkRepository extends JpaRepository<CVChunk, Long> {
    List<CVChunk> findByDocumentCVId(Long documentCVId);

    @Query(value = "SELECT c.* FROM cv_chunks c " +
            "ORDER BY c.vecteur_embedding <=> CAST(:embedding AS vector) " +
            "LIMIT :limit", nativeQuery = true)
    List<CVChunk> findNearestChunks(@Param("embedding") String embedding,
                                    @Param("limit") int limit);
}