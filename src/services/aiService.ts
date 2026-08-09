export async function getAIRecommendation(
  purchaseName: string,
  purchasePrice: number,
  currentBalance: number,
  totalIncome: number,
  totalExpenses: number,
  score: number,
  goalImpactText: string
) {
  const apiKey = import.meta.env.VITE_AI_API_KEY;
  const fallback = {
    recommendation: getRecommendationLevelFromScore(score),
    reason: `Based on a deterministic calculation, this purchase scored ${score}/100.`,
    financialImpact: `Your balance would go from ₹${currentBalance} to ₹${currentBalance - purchasePrice}.`,
    suggestedAction: score >= 60 ? 'Proceed with caution if necessary.' : 'Delay this purchase until you have more savings.',
    savingStrategy: 'Try saving 10-20% of your income before making discretionary purchases.'
  };

  if (!apiKey) {
    console.warn("No AI API Key found, using fallback recommendation.");
    return fallback;
  }

  const prompt = `You are SpendWise AI, a personal finance decision assistant. Provide general educational guidance based only on the financial information provided by the user. Explain affordability clearly and conservatively. Do not guarantee financial outcomes. Do not recommend regulated financial products. Do not claim to be a professional financial advisor. Never invent financial data. If information is missing, explicitly state that the analysis is based on available information.

User Financial Data:
- Total Income: ₹${totalIncome}
- Total Expenses: ₹${totalExpenses}
- Current Balance: ₹${currentBalance}
- Planned Purchase: ${purchaseName} for ₹${purchasePrice}
- Projected Balance After Purchase: ₹${currentBalance - purchasePrice}
- Affordability Score: ${score}/100
- Goal Impact: ${goalImpactText}

Return a structured JSON object exactly in this format without markdown code blocks (just raw JSON):
{
  "recommendation": "${getRecommendationLevelFromScore(score)}",
  "reason": "Clear explanation of why they got this score",
  "financialImpact": "Explanation of how this affects their balance",
  "suggestedAction": "What they should do right now",
  "savingStrategy": "How they can save for this item if needed"
}`;

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.2
        }
      })
    });

    if (!response.ok) {
      throw new Error("Failed to fetch from Gemini API");
    }

    const data = await response.json();
    let text = data.candidates[0].content.parts[0].text;
    
    // Strip markdown code blocks if any
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();
    
    return JSON.parse(text);
  } catch (error) {
    console.error("AI Generation error:", error);
    return fallback;
  }
}

function getRecommendationLevelFromScore(score: number) {
  if (score >= 80) return 'Affordable';
  if (score >= 60) return 'Consider Carefully';
  if (score >= 40) return 'Not Recommended';
  return 'Avoid For Now';
}

export async function getSpendingVibeCheck(expenses: any[], _incomes: any[]) {
  const apiKey = import.meta.env.VITE_AI_API_KEY;
  if (!apiKey) {
    throw new Error("No AI API Key found.");
  }

  const recentExpenses = expenses.slice(0, 10).map(e => `${e.category}: ₹${e.amount}`).join(', ');
  
  const prompt = `You are a sassy, Gen-Z financial advisor (think TikTok finance bro meets your brutally honest best friend). You use slang, you're funny, you roast bad habits, but ultimately you want to see them win. 
  
  I need a "Vibe Check" on my recent spending. Give me a roasting but encouraging paragraph based on this data:
  
  Recent Expenses: ${recentExpenses}
  
  Format: Just the raw text paragraph, no markdown, no json.`;

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.9 }
    })
  });

  if (!response.ok) {
    throw new Error("Failed to fetch from Gemini API");
  }

  const data = await response.json();
  return data.candidates[0].content.parts[0].text;
}
