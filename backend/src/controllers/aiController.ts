import { Request, Response } from 'express';
import OpenAI from 'openai';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { Document } from '../models/Document'; 
import fs from 'fs';
import path from 'path';
import crypto from 'crypto'; 


const BASE_URL = process.env.AI_BASE_URL || 'https://api.groq.com/openai/v1';
const API_KEY = process.env.AI_API_KEY || process.env.GROQ_API_KEY;
const MODEL_NAME = process.env.AI_MODEL_NAME || 'llama-3.3-70b-versatile';


const isLocal = BASE_URL.includes('127.0.0.1') || BASE_URL.includes('localhost');
const proxyUrl = process.env.HTTPS_PROXY || 'http://127.0.0.1:18081'; 
const agent = isLocal ? undefined : new HttpsProxyAgent(proxyUrl);

console.log('--------------------------------------------------');
console.log(`🔌 AI Service Initializing...`);
console.log(`   - Target URL: ${BASE_URL}`);
console.log(`   - Model Name: ${MODEL_NAME}`);
console.log(`   - Connection: ${isLocal ? '🔗 Direct (No Proxy)' : '🛡️ Via Proxy'}`); 
console.log('--------------------------------------------------');

const client = new OpenAI({
  apiKey: API_KEY, 
  baseURL: BASE_URL,
  timeout: 60000,
  httpAgent: agent,
} as any);

export const aiController = {
  
 
  generateTimeline: async (req: Request, res: Response) => {
    try {
      const { mode, data, characterName } = req.body; 

      if (!data || !Array.isArray(data) || data.length === 0) {
        return res.status(400).json({ success: false, message: 'Missing or empty data payload' });
      }

      console.log(`📡 [Map-Reduce] Starting Timeline Generation for: ${characterName || 'Main Plot'}`);

      
      let globalSummary = '';

      for (const chapter of data) {
        const docId = Number(chapter.document_id || chapter.id);
        if (docId) {
          const docRecord = await Document.findById(docId);
          if (docRecord && docRecord.ai_summary && docRecord.ai_summary.trim() !== '') {
            console.log(`   - ⚡ Cache Hit: Using saved summary for chapter ${docRecord.title || docId}`);
            globalSummary += `\n\n--- [Chapter: ${docRecord.title || 'Untitled'} (ID: ${docId})] ---\n${docRecord.ai_summary}`;
            continue; 
          }
        }

        const plainText = chapter.content ? chapter.content.replace(/<[^>]+>/g, ' ').substring(0, 8000) : '';
        if (!plainText.trim()) continue;

        const summarySystemPrompt = `You are a professional novel editor. Your task is to briefly summarize the provided chapter.`;
        const summaryUserPrompt = `
Chapter Title: ${chapter.title || chapter.document_id}
Target Character to monitor (if they appear): "${characterName}"

Text:
${plainText}

Please provide a highly concise summary of:
1. The core plot events.
2. Specific actions taken by the characters (especially the Target Character).
Keep it short and factual.`;

        console.log(`   - 🧠 Reading & Summarizing chapter: ${chapter.title || chapter.document_id}...`);
        
        const summaryCompletion = await client.chat.completions.create({
          model: MODEL_NAME,
          messages: [
            { role: "system", content: summarySystemPrompt },
            { role: "user", content: summaryUserPrompt }
          ],
          temperature: 0.3, 
          max_tokens: 1000,
        });

        const chapterSummary = summaryCompletion.choices[0]?.message?.content || '';
        
        try {
           if (docId) {
             await Document.update(docId, { ai_summary: chapterSummary });
           }
        } catch (dbErr) {
           console.error(`     ⚠️ Failed to save cache for chapter ${docId}`, dbErr);
        }

        globalSummary += `\n\n--- [Chapter: ${chapter.title || 'Untitled'} (ID: ${docId})] ---\n${chapterSummary}`;
      }

      console.log(` [Map-Reduce] Phase 1 Complete. Global summary length: ${globalSummary.length} chars.`);

      
      const cacheDir = path.join(process.cwd(), 'cache', 'timelines');
      if (!fs.existsSync(cacheDir)) {
        fs.mkdirSync(cacheDir, { recursive: true });
      }

     
      const cacheString = globalSummary + "_" + (characterName || "ALL");
      const hash = crypto.createHash('md5').update(cacheString).digest('hex');
      const cacheFilePath = path.join(cacheDir, `${hash}.json`);

      
      if (fs.existsSync(cacheFilePath)) {
        console.log(`   - 🚀 TIMELINE CACHE HIT: Loading final timeline for "${characterName || 'Main Plot'}" directly from saved file!`);
        const fileData = fs.readFileSync(cacheFilePath, 'utf-8');
        return res.json({ success: true, data: JSON.parse(fileData) });
      }

      
      const systemPrompt = `You are a Character Timeline Extractor. 
Task: Extract a chronological timeline of ALL events for "${characterName}" from the provided chapter summaries.

**CRITICAL RULES:**
1. **OUTPUT JSON ONLY**: Return a JSON Object: { "timeline": [...] }.
2. **COMPREHENSIVENESS**: Extract EVERY event where "${characterName}" takes action, speaks, or participates. 
3. **FACTUAL PERSPECTIVE**: Describe specific actions and events.
   - GOOD: "Crashed the car into a ditch and climbed out." (Active/Factual)
4. **ID MAPPING**: Look at the headers like "--- [Chapter: Title (ID: 123)] ---" and map that exact ID to "chapterId" (Number).

**EXAMPLE OUTPUT (Follow this structure):**
{
  "timeline": [
    {
      "year": "Chapter 1",
      "title": "Arrives Home",
      "description": "Entered the house and slammed the door.",
      "chapterId": 101,
      "color": "blue"
    }
  ]
}`;

      const userPrompt = `
Target Character: "${characterName}"

Input Data (Condensed Chapter Summaries):
${globalSummary}

Generate the timeline JSON. Extract ALL relevant events found in the summaries.
`;

      console.log(`📡 [Map-Reduce] Phase 2: Extracting final timeline (Calling AI)...`);

      const completion = await client.chat.completions.create({
        model: MODEL_NAME,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.2,
        max_tokens: 4000,
        response_format: { type: "json_object" }
      });

      const aiContent = completion.choices[0]?.message?.content;
      if (!aiContent) throw new Error('AI returned no content.');

      let cleanJson = aiContent.replace(/```json/g, '').replace(/```/g, '').trim();
      let timelineEvents = [];
      try {
        const parsed = JSON.parse(cleanJson);
        
        if (parsed.timeline && Array.isArray(parsed.timeline)) {
          timelineEvents = parsed.timeline;
        } else if (parsed.events && Array.isArray(parsed.events)) {
          timelineEvents = parsed.events;
        } else if (Array.isArray(parsed)) {
          timelineEvents = parsed;
        } else {
          if (parsed.title && parsed.description) {
              timelineEvents = [parsed];
          }
        }
      } catch (e) {
        console.error('JSON Parse Error Raw:', cleanJson);
        throw new Error('Failed to parse AI response as JSON');
      }
      
      if (Array.isArray(timelineEvents)) {
        timelineEvents = timelineEvents.filter((e: any) => e.title);
      } else {
        timelineEvents = [];
      }

      console.log(` Generated ${timelineEvents.length} events for ${characterName}.`);

      
      try {
        fs.writeFileSync(cacheFilePath, JSON.stringify(timelineEvents, null, 2));
        console.log(`   - Saved final timeline to script file: cache/timelines/${hash}.json`);
      } catch (err) {
        console.error('Failed to write timeline cache file:', err);
      }

      res.json({ success: true, data: timelineEvents });

    } catch (error: any) {
      console.error(' Timeline Error:', error.message);
      if (error.response) console.error(error.response.data);
      res.status(500).json({ success: false, message: error.message });
    }
  },

  
  polishText: async (req: Request, res: Response) => {
    try {
      const { content, instruction } = req.body;
      if (!content) return res.status(400).json({ success: false, message: 'Missing content' });

      const userInstruction = instruction && instruction.trim() 
        ? instruction 
        : "General polish: enhance literary quality, fix grammar, and make descriptions vivid.";

      console.log(` Polishing text...`);

      const completion = await client.chat.completions.create({
        model: MODEL_NAME,
        messages: [
          { 
            role: 'system', 
            content: 'You are a professional novel editor. Strictly follow instruction. Output ONLY the modified text.' 
          },
          { 
            role: 'user', 
            content: `Instruction: ${userInstruction}\n\nInput Text:\n${content.substring(0, 30000)}` 
          }
        ],
        temperature: 0.7,
      });

      const polishedText = completion.choices[0]?.message?.content || '';
      res.json({ success: true, data: polishedText });

    } catch (error: any) {
      console.error(' Polish Error:', error.message);
      res.status(500).json({ success: false, message: 'AI Service Error: ' + error.message });
    }
  },

  
  consultWorldEntry: async (req: Request, res: Response) => {
    try {
      const { entries, userQuery, currentContext } = req.body;

      if (!entries || !Array.isArray(entries) || entries.length === 0) {
        return res.status(400).json({ success: false, message: 'No entries selected' });
      }

      if (!userQuery) {
        return res.status(400).json({ success: false, message: 'Missing question' });
      }

      console.log(` Consulting AI about ${entries.length} entries...`);

      let entriesContext = '';
      entries.forEach((e: any, index: number) => {
        entriesContext += `\n[ENTRY ${index + 1}: ${e.name}]\n${e.content || 'No details'}\n`;
      });

      const systemPrompt = `
        You are a top-tier creative co-author assistant. 
        You have been provided with the FULL MANUSCRIPT (all chapters written so far) and specific "World Bible" entries (settings, characters, items, etc.) selected by the author.
        
        Your job is to fulfill the author's instruction/query by:
        1. Deeply analyzing the provided FULL MANUSCRIPT.
        2. Strictly adhering to the definitions in the SELECTED WORLD ENTRIES.
        3. Ensuring your output seamlessly fits the existing plot, established facts, and narrative tone.
      `;

      const userPrompt = `
        === SELECTED WORLD ENTRIES ===
        ${entriesContext}

        === FULL STORY MANUSCRIPT (All Chapters) ===
        
        ${currentContext ? currentContext.substring(0, 300000) : 'No manuscript provided.'}

        === AUTHOR'S INSTRUCTION / QUERY ===
        ${userQuery}

        Task: Fulfill the author's instruction above based on the entire manuscript and the selected world entries.
      `;

      const completion = await client.chat.completions.create({
        model: MODEL_NAME,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.8,
        max_tokens: 1500,
      });

      const aiResult = completion.choices[0]?.message?.content || 'AI silent.';
      
      res.json({ success: true, data: aiResult });

    } catch (error: any) {
      console.error(' Consult Error:', error.message);
      res.status(500).json({ success: false, message: error.message });
    }
  },
};