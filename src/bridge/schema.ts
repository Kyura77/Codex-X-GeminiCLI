import { z } from 'zod';

export const JuniorAnalysisSchema = z.object({
  task_summary: z.string(),
  bridge_needed: z.boolean(),
  risk_level: z.enum(['low', 'medium', 'high']),
  confidence: z.number().min(0).max(1),
  must_read_files: z.array(z.object({
    path: z.string(),
    reason: z.string(),
    evidence: z.array(z.object({
      line_start: z.number().optional(),
      line_end: z.number().optional(),
      snippet: z.string().optional()
    })).optional()
  })),
  should_read_files: z.array(z.object({
    path: z.string(),
    reason: z.string(),
    evidence: z.array(z.any()).optional()
  })),
  maybe_relevant_files: z.array(z.object({
    path: z.string(),
    reason: z.string()
  })),
  files_to_avoid: z.array(z.object({
    path: z.string(),
    reason: z.string()
  })),
  implementation_strategy: z.array(z.string()),
  acceptance_criteria: z.array(z.string()),
  known_unknowns: z.array(z.string()),
  assumptions: z.array(z.string()),
  senior_notes: z.array(z.string())
});

export const JuniorDiffReviewSchema = z.object({
  approved: z.boolean(),
  risk_level: z.enum(['low', 'medium', 'high']),
  blocking_issues: z.array(z.string()),
  non_blocking_suggestions: z.array(z.string()),
  test_recommendations: z.array(z.string()),
  files_reviewed: z.array(z.string()),
  summary: z.string()
});

export const SeniorHandoffSchema = z.object({
  task: z.string(),
  created_at: z.string(),
  junior_provider: z.string(),
  analysis: JuniorAnalysisSchema,
  senior_prompt: z.string(),
  context_pack: z.any().optional(),
  context_reduction: z.object({
    estimated_original_files: z.number(),
    must_read_count: z.number(),
    should_read_count: z.number(),
    maybe_relevant_count: z.number(),
    estimated_reduction_ratio: z.number()
  })
});

export type JuniorAnalysis = z.infer<typeof JuniorAnalysisSchema>;
export type JuniorDiffReview = z.infer<typeof JuniorDiffReviewSchema>;
export type SeniorHandoff = z.infer<typeof SeniorHandoffSchema>;
