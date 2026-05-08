-- =====================================================
-- Editor Feature Test Data (English Version)
-- This script provides complete test data for the EditorView
-- Includes users, projects, chapters, covering all functionalities
-- =====================================================

USE project_db;

-- Optional: Clear existing test data
-- DELETE FROM documents WHERE project_id IN (1, 2, 3, 4);
-- DELETE FROM projects WHERE project_id IN (1, 2, 3, 4);
-- DELETE FROM users WHERE user_id IN (1, 4);

-- =====================================================
-- 1. Test Users Data
-- =====================================================

-- Insert test users (passwords are encrypted)
-- Default password: testpassword123
INSERT INTO users (user_id, user_name, email, password, creat_at) 
VALUES 
  (4, 'testuser', 'test@example.com', '$2b$12$LusAHjxUW1qKHgdgoydpUu04RxiBuhsunNaw4OiL54YEucDpmgbia', NOW()),
  (1, 'author1', 'author@prosepal.com', '$2b$12$kGunjkoSDYlBNViAV1aDEOIkPReQk7y.HUZsSv3wIVxxQOE0NQcqO', NOW())
ON DUPLICATE KEY UPDATE 
  user_name = VALUES(user_name),
  email = VALUES(email);

-- =====================================================
-- 2. Test Projects Data
-- =====================================================

-- Project 1: Fantasy Adventure - For full feature testing
INSERT INTO projects (project_id, author_id, title, description) 
VALUES 
  (1, 4, 'Fantasy Adventure', 'A fantasy world story full of magic and adventure. The protagonist embarks on a thrilling journey to explore unknown realms, face powerful enemies, and discover their true destiny.')
ON DUPLICATE KEY UPDATE 
  title = VALUES(title),
  description = VALUES(description),
  author_id = VALUES(author_id); -- Ensure ownership is set to testuser (ID 4)

-- Project 2: Modern Urban - For multi-chapter testing
INSERT INTO projects (project_id, author_id, title, description) 
VALUES 
  (2, 4, 'Modern Urban Chronicles', 'Supernatural stories set in a modern metropolis. Where technology meets magic, and extraordinary events happen in ordinary lives.')
ON DUPLICATE KEY UPDATE 
  title = VALUES(title),
  description = VALUES(description),
  author_id = VALUES(author_id);

-- Project 3: Sci-Fi Future - For boundary testing
INSERT INTO projects (project_id, author_id, title, description) 
VALUES 
  (3, 4, 'Sci-Fi Future', 'A science fiction story set in the future, exploring AI, interstellar travel, and the destiny of human civilization.')
ON DUPLICATE KEY UPDATE 
  title = VALUES(title),
  description = VALUES(description),
  author_id = VALUES(author_id);

-- Project 4: Edge Case Project - For testing special scenarios
INSERT INTO projects (project_id, author_id, title, description) 
VALUES 
  (4, 4, 'Edge Case Testing', 'A dedicated project for testing various boundary conditions and special scenarios.')
ON DUPLICATE KEY UPDATE 
  title = VALUES(title),
  description = VALUES(description),
  author_id = VALUES(author_id);

-- =====================================================
-- 3. Chapters for Project 1 (Fantasy Adventure)
-- =====================================================

-- Chapter 1: Prologue - Basic HTML formatting
INSERT INTO documents (document_id, project_id, title, content, display_order) 
VALUES (
  1,
  1,
  'Prologue: The Beginning of Destiny',
  '<p style="text-align: center;"><strong>The Beginning of Destiny</strong></p><p>In a faraway kingdom, there lived a young <em>mage</em> named <u>Allen</u>. From a very young age, Allen showed incredible <mark style="background-color: #fef3c7;">magical talent</mark>.</p><p>One day, as he walked into the <strong><span style="color: #be123c;">ancient library</span></strong>, a mysterious spellbook suddenly emitted a <strong><em>blinding light</em></strong>. Allen reached out and gently touched the book.</p><p style="font-size: 18px;">"Is this... the choice of destiny?" he murmured.</p><ul><li>Magic Awakening</li><li>Call of Destiny</li><li>Adventure Begins</li></ul>',
  1
)
ON DUPLICATE KEY UPDATE 
  title = VALUES(title),
  content = VALUES(content);

-- Chapter 2: Awakening - Multiple fonts and colors
INSERT INTO documents (document_id, project_id, title, content, display_order) 
VALUES (
  2,
  1,
  'Chapter 1: Magical Awakening',
  '<h2 style="color: #1d4ed8; font-family: Arial;">Magical Awakening</h2><p style="font-family: \"Microsoft YaHei\"; font-size: 16px;">Allen felt a surge of power within him. His fingertips began to sparkle with <strong style="color: #b45309;">golden light</strong>, illuminating the entire room.</p><p style="text-align: right;">"Is this... real magic?" he exclaimed excitedly.</p><p>As the power awakened, Allen heard a mysterious voice:</p><blockquote style="border-left: 4px solid #0f766e; padding-left: 15px; font-style: italic; color: #0f766e;">"Oh chosen one, your journey has just begun. Darkness is falling, and only you can save this world."</blockquote><ol><li>Power Awakens</li><li>Accept Mission</li><li>Prepare for Journey</li></ol><p style="background-color: #fee2e2; padding: 10px;">Allen took a deep breath. He knew there was no turning back. He had to accept this challenge to protect everything he loved.</p>',
  2
)
ON DUPLICATE KEY UPDATE 
  title = VALUES(title),
  content = VALUES(content);

-- Chapter 3: Journey Begins - Rich text & Key events
INSERT INTO documents (document_id, project_id, title, content, display_order) 
VALUES (
  3,
  1,
  'Chapter 2: The Journey Begins',
  '<p>The next morning, Allen packed his bags and set off for the <strong>Valley of Dragons</strong>. Legend had it that a <em>mysterious power</em> capable of saving the world was hidden there.</p><p>Along the way, he faced many challenges. First, he had to cross the <u>Perilous Forest</u>, home to fierce magical beasts. Allen moved cautiously, his staff ready to cast spells at any moment.</p><p style="color: #6b21a8;">Suddenly, a giant <strong>Shadow Wolf</strong> leaped from behind a tree, its eyes glowing red. Allen immediately raised his staff and chanted a spell. A bolt of lightning shot from the tip, striking the wolf, but instead of falling, it became even more enraged.</p><p>The battle lasted a long time. Allen cast spell after spell: <span style="background-color: #dbeafe;">Frost Arrow</span>, <span style="background-color: #dcfce7;">Fireball</span>, <span style="background-color: #f3e8ff;">Heal</span>. Finally, he found the wolf\'s weakness and defeated it with a powerful burst of Light Magic.</p><p><strong>Key Moment:</strong> After defeating the Shadow Wolf, Allen discovered a <mark style="background-color: #fef3c7;">mysterious magical crest</mark>. It emitted a faint glow, seeming to resonate with his own magical power. This is a significant node in the timeline.</p><p>Exhausted, Allen sat on the ground, but his heart was filled with accomplishment. He knew this was just the beginning. He had to become stronger to fulfill his destiny.</p><p>Continuing his journey, Allen pondered why he had embarked on this path. Was it for power? For glory? Or to protect? Perhaps none of these were the true answer. The real answer could only be found at the end of the journey.</p><p style="text-align: center; font-family: KaiTi; font-size: 20px;"><strong>The adventure has only just begun...</strong></p>',
  3
)
ON DUPLICATE KEY UPDATE 
  title = VALUES(title),
  content = VALUES(content);

-- =====================================================
-- 4. Chapters for Project 2 (Modern Urban)
-- =====================================================

-- Chapter 4: Empty Chapter
INSERT INTO documents (document_id, project_id, title, content, display_order) 
VALUES (
  4,
  2,
  'Chapter 1',
  '',
  1
)
ON DUPLICATE KEY UPDATE 
  title = VALUES(title),
  content = VALUES(content);

-- Chapter 5: Plain Text
INSERT INTO documents (document_id, project_id, title, content, display_order) 
VALUES (
  5,
  2,
  'Chapter 2: Urban Night',
  'The city at late night is always full of mystery. Neon lights flicker on the streets, crowds come and go. In this seemingly ordinary world, unknown secrets are hidden.',
  2
)
ON DUPLICATE KEY UPDATE 
  title = VALUES(title),
  content = VALUES(content);

-- Chapters 6-10: Multi-chapter switching
INSERT INTO documents (document_id, project_id, title, content, display_order) 
VALUES 
  (6, 2, 'Chapter 3: The Anomaly', '<p>A strange light suddenly appeared in the sky. Everyone stopped and looked up. This is a key event node in the timeline, marking a turning point in the story.</p><p style="font-family: SimSun; color: #b45309;">A massive <strong>rift in space-time</strong> appeared, an unprecedented phenomenon. Scientists were baffled, and panic spread among the populace.</p>', 3),
  (7, 2, 'Chapter 4: Awakening', '<p>The protagonist felt a power awakening within. It felt both familiar and strange.</p><p><em>Key Moment: In an abandoned lab, the protagonist discovers their true identity—a product of genetic experimentation with superhuman abilities.</em></p>', 4),
  (8, 2, 'Chapter 5: The Truth', '<p>The truth is often more complex than imagined. The protagonist realizes they are not just an ordinary person.</p><p style="text-align: right; background-color: #fee2e2; padding: 10px;">After deep investigation, a massive conspiracy is uncovered. The entire city is under the control of a secret organization.</p>', 5),
  (9, 2, 'Chapter 6: The Choice', '<p>Faced with a choice, the protagonist must decide. This decision will affect the fate of the world.</p><ul><li>Option A: Fight the organization, risk losing everything</li><li>Option B: Join them, gain power but lose freedom</li><li>Option C: Find a third path, seek balance</li></ul>', 6),
  (10, 2, 'Chapter 7: The Final Battle', '<p>The final battle is about to begin. All preparations have led to this moment. At the last node of the timeline, the protagonist makes the ultimate choice.</p><p style="font-size: 18px; color: #be123c;"><strong>The decisive moment has arrived. All clues converge here. This is the climax of the story.</strong></p>', 7)
ON DUPLICATE KEY UPDATE 
  title = VALUES(title),
  content = VALUES(content);

-- =====================================================
-- 4.5. Extra Formatting Test Chapters for Project 2
-- =====================================================

-- Chapter 14: Font Testing
INSERT INTO documents (document_id, project_id, title, content, display_order) 
VALUES (
  14,
  2,
  'Chapter 8: Font Formatting Test',
  '<p style="font-family: Times New Roman;">This is Times New Roman font</p><p style="font-family: Arial;">This is Arial font</p><p style="font-family: SimSun;">This is SimSun font</p><p style="font-family: KaiTi;">This is KaiTi font</p><p style="font-family: Microsoft YaHei;">This is Microsoft YaHei font</p><p style="font-size: 10px;">Tiny font size</p><p style="font-size: 12px;">Small font size</p><p style="font-size: 14px;">Normal font size</p><p style="font-size: 16px;">Large font size</p><p style="font-size: 18px;">Huge font size</p>',
  8
)
ON DUPLICATE KEY UPDATE 
  title = VALUES(title),
  content = VALUES(content);

-- Chapter 15: Color Testing
INSERT INTO documents (document_id, project_id, title, content, display_order) 
VALUES (
  15,
  2,
  'Chapter 9: Color Testing',
  '<p style="color: #1f2937;">Dark Gray Text #1f2937</p><p style="color: #be123c;">Red Text #be123c</p><p style="color: #b45309;">Orange Text #b45309</p><p style="color: #0f766e;">Teal Text #0f766e</p><p style="color: #1d4ed8;">Blue Text #1d4ed8</p><p style="color: #6b21a8;">Purple Text #6b21a8</p><p><span style="background-color: #ffffff;">White Highlight</span></p><p><span style="background-color: #fef3c7;">Yellow Highlight</span></p><p><span style="background-color: #fee2e2;">Red Highlight</span></p><p><span style="background-color: #dbeafe;">Blue Highlight</span></p><p><span style="background-color: #dcfce7;">Green Highlight</span></p><p><span style="background-color: #f3e8ff;">Purple Highlight</span></p>',
  9
)
ON DUPLICATE KEY UPDATE 
  title = VALUES(title),
  content = VALUES(content);

-- Chapter 16: Alignment & Lists
INSERT INTO documents (document_id, project_id, title, content, display_order) 
VALUES (
  16,
  2,
  'Chapter 10: Alignment & Lists Test',
  '<p style="text-align: left;">Left aligned text</p><p style="text-align: center;">Center aligned text</p><p style="text-align: right;">Right aligned text</p><ul><li>Unordered list item 1</li><li>Unordered list item 2</li><li>Unordered list item 3</li></ul><ol><li>Ordered list item 1</li><li>Ordered list item 2</li><li>Ordered list item 3</li></ol><p><strong>Bold Text</strong> <em>Italic Text</em> <u>Underlined Text</u> <s>Strikethrough Text</s></p>',
  10
)
ON DUPLICATE KEY UPDATE 
  title = VALUES(title),
  content = VALUES(content);

-- =====================================================
-- 5. Chapters for Project 3 (Sci-Fi Future)
-- =====================================================

-- Chapter 11: Complex HTML
INSERT INTO documents (document_id, project_id, title, content, display_order) 
VALUES (
  11,
  3,
  'Prologue: Future World',
  '<div style="padding: 20px; border: 2px solid #5D7AE6; border-radius: 10px;"><h1 style="color: #1d4ed8; text-align: center;">Year 2077, New Earth</h1><p style="font-size: 18px; line-height: 1.8;">In a future where AI is highly advanced, humans and AI coexist in a new world. Technology brings convenience but also new challenges.</p><div style="background-color: #f3e8ff; padding: 15px; margin: 20px 0; border-left: 5px solid #6b21a8;"><strong>Key Events:</strong><ul><li>AI gains sentience</li><li>First Human-AI dialogue</li><li>Establishment of the New World</li></ul></div><p>The protagonist, <strong style="color: #be123c;">Amy</strong>, is a young <em>systems engineer</em> responsible for maintaining the city\'s <u>Core AI System</u>. One day, she discovers an anomalous signal...</p></div>',
  1
)
ON DUPLICATE KEY UPDATE 
  title = VALUES(title),
  content = VALUES(content);

-- Chapter 12: Special Characters & Emoji
INSERT INTO documents (document_id, project_id, title, content, display_order) 
VALUES (
  12,
  3,
  'Chapter 1: Anomalous Signal 😱',
  '<p>When Amy saw that <strong>anomalous signal</strong>, she instantly knew something was wrong. The display read:</p><p style="font-family: monospace; background-color: #1f2937; color: #ffffff; padding: 15px; border-radius: 5px;">ERROR: System Override Detected 🚨<br/>Code: 0x7F4A2B<br/>Status: CRITICAL ⚠️</p><p>She grabbed her comms: <em>"HQ, this is Amy. I\'ve found a serious problem!"</em></p><p>An anxious voice came from the other end: <u>"What\'s the situation? Do you need backup?"</u></p><p>Amy took a deep breath: <strong>"Emergency. We might need to initiate the containment protocol."</strong></p>',
  2
)
ON DUPLICATE KEY UPDATE 
  title = VALUES(title),
  content = VALUES(content);

-- Chapter 13: Large Content (Performance Test)
INSERT INTO documents (document_id, project_id, title, content, display_order) 
VALUES (
  13,
  3,
  'Chapter 2: Deep Investigation',
  CONCAT(
    '<p><strong>(Data restored successfully)</strong> Amy began her deep investigation. She had to find the root cause, or the entire system might collapse.</p>',
    REPEAT('<p>This is a repeated paragraph to test the editor\'s performance when handling large amounts of content. Each paragraph contains various formatting styles. As the investigation deepened, Amy discovered more clues, but also faced greater dangers. The system anomaly seemed linked to an unknown AI entity.</p>', 30),
    '<p>After hours of effort, Amy finally found a trail. These clues pointed to a shocking truth...</p>'
  ),
  3
)
ON DUPLICATE KEY UPDATE 
  title = VALUES(title),
  content = VALUES(content);

-- =====================================================
-- 6. Chapters for Project 4 (Edge Case Testing)
-- =====================================================

-- Chapter 17: Long Title
INSERT INTO documents (document_id, project_id, title, content, display_order) 
VALUES (
  17,
  4,
  'This is a very, very long chapter title used to test if the editor handles long titles correctly in the layout, checking for truncation or wrapping issues',
  '<p>This is the content for the long title chapter. The editor should handle long titles gracefully.</p>',
  1
)
ON DUPLICATE KEY UPDATE 
  title = VALUES(title),
  content = VALUES(content);

-- Chapter 18: Special Characters & XSS
INSERT INTO documents (document_id, project_id, title, content, display_order) 
VALUES (
  18,
  4,
  'Special Char Test <>&"\'',
  '<p>Test Special Chars: &lt;script&gt;alert(\'xss\')&lt;/script&gt;</p><p>Test HTML Entities: &amp; &lt; &gt; &quot; &apos;</p><p>Test Quotes: "Double" and \'Single\'</p><p>Test Brackets: <Tag> and </Tag></p><p>Test Symbols: © ® ™ € £ ¥</p>',
  2
)
ON DUPLICATE KEY UPDATE 
  title = VALUES(title),
  content = VALUES(content);

-- Chapter 19: Pure HTML Tags
INSERT INTO documents (document_id, project_id, title, content, display_order) 
VALUES (
  19,
  4,
  'Pure HTML Tag Test',
  '<div><h1>Heading 1</h1><h2>Heading 2</h2><h3>Heading 3</h3></div><p>Paragraph text</p><br/><hr/><blockquote>Blockquote text</blockquote><pre>Preformatted text</pre><code>Code text</code>',
  3
)
ON DUPLICATE KEY UPDATE 
  title = VALUES(title),
  content = VALUES(content);

-- Chapter 20: Complex Mixed Formatting
INSERT INTO documents (document_id, project_id, title, content, display_order) 
VALUES (
  20,
  4,
  'Complex Mixed Formatting',
  '<p style="font-family: Arial; color: #be123c; font-size: 18px; text-align: center; background-color: #fef3c7;"><strong><em><u>This text has multiple styles applied simultaneously</u></em></strong></p><div style="border: 2px solid #5D7AE6; padding: 15px; margin: 10px 0;"><ul><li style="color: #1d4ed8;"><strong>List Item 1</strong></li><li style="color: #6b21a8;"><em>List Item 2</em></li><li style="color: #0f766e;"><u>List Item 3</u></li></ul></div>',
  4
)
ON DUPLICATE KEY UPDATE 
  title = VALUES(title),
  content = VALUES(content);

-- =====================================================
-- Complete
-- =====================================================

SELECT 'English test data import completed successfully!' as status;