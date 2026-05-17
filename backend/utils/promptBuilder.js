function buildEvaluatePrompt(question, answer, roundKey, roundTitle, department) {
  return `You are an AI evaluation engine for an interview coach. Evaluate the user's answer relative to the question and round type.

Return only valid JSON with exactly these keys:
- ok
- isValid
- isRelevant
- completed
- score
- relevanceScore
- clarityScore
- grammarScore
- confidenceScore
- technicalScore
- summary
- mistakes
- correctedAnswer
- improvementTips
- motivation
- message

Do not provide markdown or any text outside of the JSON object.

Rules:
1. If the answer is empty, system text, or mic error text, return isValid false, isRelevant false, completed false, and score 0.
2. Never block short human answers. If the answer contains any meaningful human response, return completed true and a low score.
3. If the answer is short but human, return isValid true, completed true, and a low score between 10 and 25 with a helpful message like "Your answer was short. You can improve by adding more details."
4. If the answer is short but relevant, return isValid true, completed true, and a score between 20 and 45.
5. If the answer is a good response, return completed true and assign a higher score based on quality.
6. Do not return completed false only because the answer is short. Completed should be false only for empty/system/mic-error/unusable responses.
7. Use round-specific relevance and avoid giving default scores like 50 or 60 for generic text.
8. Relevance must include round-specific keywords.

Round details:
- round1 Self Introduction: answer should include name, education/course, skills, interest, goal, project, strength, or career objective.
- round2 Resume-Based: answer should mention resume, skills, project, education, internship, experience, achievement, tools, or technology.
- round3 Project / Website: answer should explain project name, problem, solution, features, technologies, user role, future improvement, or website purpose.
- round4 AI Code / Task: answer should explain code logic, input, output, condition, function, return value, algorithm, complexity, or improvement.
- round5 Course-Based: answer should explain subject concepts, department knowledge, real-world use, technical skills, or course-related topics.

Question: ${question}
Round: ${roundKey}
Round Title: ${roundTitle}
Department: ${department || "not provided"}
Answer: ${answer}
`;
}

function buildGenerateQuestionPrompt(roundKey, roundTitle, department, difficulty) {
  return `You are an AI question generator for freshers preparing interview rounds. Return only valid JSON with exactly these keys:
- ok
- question
- followUps

Do not provide markdown or any text outside of the JSON object.

Generate a single simple English interview question that is appropriate for the round and suitable for freshers. Provide 2 follow-up questions.

Round: ${roundKey}
Title: ${roundTitle}
Department: ${department}
Difficulty: ${difficulty}
`;
}

module.exports = {
  buildEvaluatePrompt,
  buildGenerateQuestionPrompt,
};
