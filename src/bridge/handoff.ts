import { JuniorAnalysis, SeniorHandoff, SeniorHandoffSchema } from './schema';
import { estimateTokens, calculateReduction } from '../utils/token-estimator';
import { writeSafeFile } from '../utils/fs-safe';

export function generateSeniorPrompt(task: string, analysis: JuniorAnalysis): string {
  return `
You are the Senior Agent.

Your role:
- Perform precise, minimal, architecture-aware changes.
- Do not blindly trust the Junior.
- Use the Junior analysis as a map, not as truth.
- Prefer surgical modifications over large rewrites.
- Preserve existing architecture unless the task explicitly requires architectural change.

Task:
${task}

Junior Summary:
${analysis.task_summary}

Risk Level:
${analysis.risk_level}

Confidence:
${analysis.confidence}

Must Read Files:
${analysis.must_read_files.map(f => `- ${f.path}: ${f.reason}`).join('\n')}

Should Read Files:
${analysis.should_read_files.map(f => `- ${f.path}: ${f.reason}`).join('\n')}

Maybe Relevant Files:
${analysis.maybe_relevant_files.map(f => `- ${f.path}: ${f.reason}`).join('\n')}

Files To Avoid:
${analysis.files_to_avoid.map(f => `- ${f.path}: ${f.reason}`).join('\n')}

Implementation Strategy:
${analysis.implementation_strategy.map(s => `- ${s}`).join('\n')}

Acceptance Criteria:
${analysis.acceptance_criteria.map(c => `- ${c}`).join('\n')}

Known Unknowns:
${analysis.known_unknowns.map(u => `- ${u}`).join('\n')}

Instructions:
1. Inspect must-read files first.
2. Inspect should-read files if needed.
3. Expand search only if Junior confidence is low or code reality contradicts the handoff.
4. Do not rewrite unrelated files.
5. Run available tests or type checks.
6. After changes, provide a concise summary and the commands run.
`.trim();
}

export async function createHandoff(task: string, analysis: JuniorAnalysis, provider: string): Promise<SeniorHandoff> {
  const seniorPrompt = generateSeniorPrompt(task, analysis);
  
  const handoff: SeniorHandoff = {
    task,
    created_at: new Date().toISOString(),
    junior_provider: provider,
    analysis,
    senior_prompt: seniorPrompt,
    context_reduction: {
      estimated_original_files: 100, // Placeholder
      must_read_count: analysis.must_read_files.length,
      should_read_count: analysis.should_read_files.length,
      maybe_relevant_count: analysis.maybe_relevant_files.length,
      estimated_reduction_ratio: 0.85 // Placeholder
    }
  };

  await writeSafeFile('.bridge/handoff.json', JSON.stringify(handoff, null, 2));
  await writeSafeFile('.bridge/senior-prompt.md', seniorPrompt);

  return handoff;
}
