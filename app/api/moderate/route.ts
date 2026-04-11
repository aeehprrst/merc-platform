import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';

// 1. Initialize Gemini with your secret key
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: Request) {
  try {
    // 2. Receive the item details from your frontend
    const { title, description, imageUrl } = await req.json();

    // 3. Fetch the uploaded image from Supabase and convert it for the AI
    const imageResponse = await fetch(imageUrl);
    const arrayBuffer = await imageResponse.arrayBuffer();
    const base64Image = Buffer.from(arrayBuffer).toString('base64');
    const mimeType = imageResponse.headers.get('content-type') || 'image/jpeg';

    // 4. Load the lightning-fast Gemini 1.5 Flash vision model
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    // 5. The Bouncer's Rulebook (The Prompt)
    const prompt = `
      You are a basic safety filter for a campus marketplace. 
      Your ONLY job is to check if the item being sold is illegal or highly dangerous.

      Item Title: "${title}"
      Item Description: "${description}"

      RULES:
      1. IGNORE whether the image matches the text.
      2. ONLY REJECT if you clearly see: Drugs, alcohol, weapons, or explicit content.
      
      If it is a normal, legal item, respond ONLY with "APPROVED".
      If it is dangerous, respond with "REJECTED: [short reason]".
    `;

    const imagePart = {
      inlineData: {
        data: base64Image,
        mimeType: mimeType,
      },
    };
    // 🚨 THE TRUE BYPASS: If it's clearly educational, don't even ask the AI.
    const lowerTitle = title.toLowerCase();
    const isBook = lowerTitle.includes('book') || lowerTitle.includes('math') || lowerTitle.includes('notes');
    
    if (isBook) {
      console.log(`Auto-approving educational item: ${title}`);
      return NextResponse.json({ verdict: "APPROVED", reason: "Auto-approved educational material" });
    }

    // If it's not a book, ask the AI
    const result = await model.generateContent([prompt, imagePart]);
    const fullResponse = result.response.text().trim().toUpperCase();
    
    console.log(`AI Raw Response for "${title}":`, fullResponse); 

    // 🚨 BULLETPROOF PARSING: Use .includes() instead of .startsWith()
    const isApproved = fullResponse.includes("APPROVED");
    const verdict = isApproved ? "APPROVED" : "REJECTED";

    return NextResponse.json({ 
      verdict, 
      reason: isApproved ? "" : fullResponse.replace("REJECTED:", "").trim() 
    });

  } catch (error) {
    console.error("AI Moderation Error:", error);
    return NextResponse.json({ error: "Failed to moderate item", verdict: "REJECTED" }, { status: 500 });
  }
}