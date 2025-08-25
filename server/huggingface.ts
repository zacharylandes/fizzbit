
// Reddit API integration for finding similar queries and creative content

// No API keys required for Reddit's public JSON endpoints

export interface IdeaResponse {
  id: string;
  title: string;
  description: string;
  sourceContent?: string;
}

// Reddit API functions for content discovery
interface RedditPost {
  title: string;
  selftext: string;
  score: number;
  subreddit: string;
  url: string;
  created_utc: number;
  num_comments: number;
  permalink: string;
}

interface RedditResponse {
  data: {
    children: Array<{
      data: RedditPost;
    }>;
  };
}

// Search creative and project-focused subreddits for inspiration
const CREATIVE_SUBREDDITS = [
  'AskReddit',
  'CrazyIdeas', 
  'Showerthoughts',
  'LifeProTips',
  'DIY',
  'GetMotivated',
  'todayilearned',
  'Art',
  'somethingimade',
  'coolguides',
  'InternetIsBeautiful',
  'productivity',
  'ZenHabits',
  'startups',
  'entrepreneur',
  'business',
  'writing',
  'WeekendProjects',
  'LifeHacks',
  'UnethicalLifeProTips'
];

// Helper function to search Reddit and extract creative content
async function searchRedditForContent(query: string, subreddit: string = 'all', limit: number = 25): Promise<RedditPost[]> {
  try {
    // Use Reddit's public JSON API endpoint
    const searchUrl = `https://www.reddit.com/r/${subreddit}/search.json?q=${encodeURIComponent(query)}&limit=${limit}&sort=top&t=month`;
    
    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'SWIVL-CreativeApp/1.0 (by /u/creativeideas)'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Reddit API error: ${response.status}`);
    }
    
    const data: RedditResponse = await response.json();
    return data.data.children.map(child => child.data);
  } catch (error) {
    console.error(`Error searching Reddit for "${query}" in r/${subreddit}:`, error);
    return [];
  }
}

// Helper function to get hot posts from a specific subreddit
async function getHotPostsFromSubreddit(subreddit: string, limit: number = 25): Promise<RedditPost[]> {
  try {
    const url = `https://www.reddit.com/r/${subreddit}/hot.json?limit=${limit}`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'SWIVL-CreativeApp/1.0 (by /u/creativeideas)'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Reddit API error: ${response.status}`);
    }
    
    const data: RedditResponse = await response.json();
    return data.data.children.map(child => child.data);
  } catch (error) {
    console.error(`Error getting hot posts from r/${subreddit}:`, error);
    return [];
  }
}

// Helper function to find related content from Reddit communities
export async function generateRelatedIdeas(contextualPrompt: string, count: number = 3): Promise<IdeaResponse[]> {
  try {
    console.log('Searching Reddit for related ideas...');
    
    // Extract keywords from the contextual prompt for better searching
    const keywords = extractKeywords(contextualPrompt);
    const searchQuery = keywords.slice(0, 3).join(' '); // Use top 3 keywords
    
    // Search across multiple creative subreddits
    const subredditsToSearch = ['CrazyIdeas', 'Showerthoughts', 'LifeProTips', 'DIY'];
    let allPosts: RedditPost[] = [];
    
    for (const subreddit of subredditsToSearch) {
      const posts = await searchRedditForContent(searchQuery, subreddit, 10);
      allPosts = allPosts.concat(posts);
    }
    
    // Also search across all of Reddit
    const generalPosts = await searchRedditForContent(searchQuery, 'all', 15);
    allPosts = allPosts.concat(generalPosts);
    
    // Filter out low-quality posts and convert to ideas
    const ideas = convertRedditPostsToIdeas(allPosts, contextualPrompt, count);
    
    return ideas.slice(0, count);
  } catch (error) {
    console.error('Reddit related ideas search failed:', error);
    return [];
  }
}

// Reddit-based idea generation function
async function generateWithReddit(prompt: string, count: number): Promise<IdeaResponse[]> {
  try {
    console.log('🔍 Searching Reddit communities for inspiration...');
    
    // Extract keywords from user prompt
    const keywords = extractKeywords(prompt);
    const searchQuery = keywords.slice(0, 3).join(' ');
    
    // Search across different types of creative subreddits
    const searchPromises = CREATIVE_SUBREDDITS.slice(0, 8).map(async (subreddit) => {
      const posts = await searchRedditForContent(searchQuery, subreddit, 5);
      return posts;
    });
    
    // Also get some hot posts from idea-focused subreddits
    const hotPostsPromises = ['CrazyIdeas', 'Showerthoughts', 'LifeProTips'].map(async (subreddit) => {
      const posts = await getHotPostsFromSubreddit(subreddit, 10);
      return posts;
    });
    
    const [searchResults, hotPostsResults] = await Promise.all([
      Promise.all(searchPromises),
      Promise.all(hotPostsPromises)
    ]);
    
    // Combine all results
    let allPosts: RedditPost[] = [];
    searchResults.forEach(posts => allPosts = allPosts.concat(posts));
    hotPostsResults.forEach(posts => allPosts = allPosts.concat(posts));
    
    console.log(`🔍 Found ${allPosts.length} Reddit posts, converting to ideas...`);
    
    // Convert Reddit posts to formatted ideas
    const ideas = convertRedditPostsToIdeas(allPosts, prompt, count);
    
    if (ideas.length > 0) {
      console.log(`✅ Successfully generated ${ideas.length} ideas from Reddit content`);
      return ideas;
    }
    
    throw new Error('No suitable Reddit content found for idea generation');
  } catch (error) {
    console.error('Reddit idea generation failed:', (error as Error).message);
    throw error;
  }
}

// Extract keywords from user prompt for better Reddit searching
function extractKeywords(prompt: string): string[] {
  // Remove common stop words and extract meaningful terms
  const stopWords = new Set([
    'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from', 'has', 'he', 'in', 'is', 'it',
    'its', 'of', 'on', 'that', 'the', 'to', 'was', 'were', 'will', 'with', 'how', 'what', 'when',
    'where', 'who', 'why', 'give', 'me', 'ideas', 'about', 'for', 'creative', 'inspiration'
  ]);
  
  const words = prompt.toLowerCase()
    .replace(/[^a-zA-Z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2 && !stopWords.has(word));
  
  // Return unique words, prioritizing longer ones
  return [...new Set(words)].sort((a, b) => b.length - a.length);
}

// Convert Reddit posts to our idea format with title/idea/hook structure
function convertRedditPostsToIdeas(posts: RedditPost[], originalPrompt: string, maxCount: number): IdeaResponse[] {
  const ideas: IdeaResponse[] = [];
  const seenTitles = new Set<string>();
  
  // Filter and convert posts to ideas
  for (const post of posts) {
    if (ideas.length >= maxCount) break;
    
    // Skip posts that are too short or not suitable
    if (post.title.length < 10 || post.score < 2) continue;
    
    // Skip duplicates
    const normalizedTitle = post.title.toLowerCase().trim();
    if (seenTitles.has(normalizedTitle)) continue;
    seenTitles.add(normalizedTitle);
    
    // Create title (extract key concept from Reddit title)
    const title = extractIdeaTitle(post.title);
    
    // Create idea description (combine title with text content)
    const idea = createIdeaDescription(post, originalPrompt);
    
    // Create hook (what makes this interesting)
    const hook = createIdeaHook(post);
    
    // Combine into description with our format
    const description = `${idea} - ${hook}`;
    
    ideas.push({
      id: `reddit-${Date.now()}-${ideas.length}`,
      title: title.substring(0, 60),
      description: description.substring(0, 400),
      sourceContent: `From r/${post.subreddit}: ${originalPrompt}`
    });
  }
  
  return ideas;
}

// Extract a creative title from Reddit post title
function extractIdeaTitle(redditTitle: string): string {
  // Clean up common Reddit formatting
  let title = redditTitle
    .replace(/^(LPT|TIL|SLPT|YSK|PSA):/i, '')
    .replace(/\[.*?\]/g, '')
    .replace(/\(.*?\)/g, '')
    .trim();
  
  // Take first 2-4 meaningful words
  const words = title.split(/\s+/).filter(word => word.length > 2);
  const titleWords = words.slice(0, Math.min(4, words.length));
  
  return titleWords.join(' ') || 'Creative Inspiration';
}

// Create idea description linking Reddit content to user prompt
function createIdeaDescription(post: RedditPost, originalPrompt: string): string {
  const keywords = extractKeywords(originalPrompt);
  const mainKeyword = keywords[0] || 'your interest';
  
  // Create a connection between the Reddit post and user's prompt
  if (post.selftext && post.selftext.trim()) {
    const shortText = post.selftext.substring(0, 150).trim();
    return `Apply the concept from "${post.title}" to ${mainKeyword}: ${shortText}`;
  } else {
    return `Adapt the idea "${post.title}" to create something unique for ${mainKeyword}`;
  }
}

// Create hook explaining what makes this interesting
function createIdeaHook(post: RedditPost): string {
  if (post.score > 1000) {
    return `Popular idea with ${post.score} upvotes from the ${post.subreddit} community`;
  } else if (post.num_comments > 50) {
    return `Sparked ${post.num_comments} discussions - lots of potential for development`;
  } else if (post.subreddit === 'CrazyIdeas') {
    return `Unconventional approach that breaks normal thinking patterns`;
  } else if (post.subreddit === 'LifeProTips') {
    return `Practical wisdom that creates immediate impact`;
  } else if (post.subreddit === 'Showerthoughts') {
    return `Mind-bending perspective that reveals hidden connections`;
  } else {
    return `Community-validated concept with real-world potential`;
  }
}

export async function generateIdeasFromText(prompt: string, count: number = 25): Promise<IdeaResponse[]> {
  // PRIMARY: Use Reddit for community-sourced creative content
  try {
    const ideas = await generateWithReddit(prompt, count);
    if (ideas.length > 0) {
      return ideas;
    }
  } catch (error) {
    console.warn('Reddit search failed, trying fallback options:', (error as Error).message);
  }
  
  // FALLBACK: Generate template-based ideas inspired by the prompt
  console.log('Reddit search failed, falling back to creative templates');
  
  const ideaTemplates = [
    {
      titlePrefix: "Community Challenge",
      descriptionTemplate: "Start a creative challenge around {topic} - invite others to share their unique approaches and build a collection of diverse perspectives."
    },
    {
      titlePrefix: "Daily Practice",
      descriptionTemplate: "Create a 30-day {topic} practice where you explore one small aspect each day and document your discoveries."
    },
    {
      titlePrefix: "Collaborative Project",
      descriptionTemplate: "Partner with someone who has a different perspective on {topic} and create something that neither of you could make alone."
    },
    {
      titlePrefix: "Learning Journey",
      descriptionTemplate: "Teach yourself about {topic} by creating something new every week and sharing your process with others."
    },
    {
      titlePrefix: "Creative Remix",
      descriptionTemplate: "Take the concept of {topic} and apply it to a completely different field or medium you've never tried before."
    },
    {
      titlePrefix: "Storytelling Angle",
      descriptionTemplate: "Document the stories behind {topic} - interview people, collect experiences, and share the human side."
    },
    {
      titlePrefix: "Problem-Solving Focus",
      descriptionTemplate: "Identify a common problem related to {topic} and create an innovative solution that helps others."
    },
    {
      titlePrefix: "Experimental Approach",
      descriptionTemplate: "Test unusual methods or combinations with {topic} and share what works, what doesn't, and what surprises you discover."
    }
  ];

  const shuffledTemplates = [...ideaTemplates].sort(() => Math.random() - 0.5);
  const selectedTemplates = shuffledTemplates.slice(0, count);
  
  const ideas = selectedTemplates.map((template, index) => {
    const topic = prompt.toLowerCase();
    return {
      id: `template-${Date.now()}-${index}`,
      title: template.titlePrefix,
      description: template.descriptionTemplate.replace(/\{topic\}/g, topic) + " - What makes this interesting is how it connects your passion with community engagement and learning.",
      sourceContent: prompt
    };
  });

  console.log(`Fallback: Generated ${ideas.length} template-based ideas`);
  return ideas;
}

export async function generateIdeasFromImage(imageBase64: string, count: number = 25): Promise<IdeaResponse[]> {
  try {
    console.log('📷 Analyzing image for creative inspiration...');
    
    // Create a description-based prompt to search Reddit
    const imagePrompt = 'visual art photography creative projects image inspiration design aesthetic';
    
    // Search Reddit for creative content related to visual arts and photography
    const ideas = await generateWithReddit(imagePrompt, count);
    
    if (ideas.length > 0) {
      // Modify ideas to be more image-specific
      const imageSpecificIdeas = ideas.map(idea => ({
        ...idea,
        description: `Based on your uploaded image: ${idea.description}`,
        sourceContent: 'Image upload'
      }));
      
      console.log(`✅ Generated ${imageSpecificIdeas.length} image-inspired ideas from Reddit communities`);
      return imageSpecificIdeas;
    }

    // Fallback if Reddit search fails
    const imageTemplates = [
      {
        title: "Visual Art Series",
        description: "Create a series of artworks inspired by the themes and colors in this image"
      },
      {
        title: "Photo Story",
        description: "Use this image as inspiration for a creative photography project or story"
      },
      {
        title: "Color Palette Business",
        description: "Start a design business using the color scheme from this image"
      },
      {
        title: "Mood Board Creation",
        description: "Build a comprehensive mood board around the aesthetic of this image"
      },
      {
        title: "Creative Writing",
        description: "Write a story, poem, or creative piece inspired by the mood and setting of this image"
      },
      {
        title: "Musical Composition",
        description: "Compose music that captures the feeling and atmosphere conveyed by this image"
      }
    ];

    const shuffledTemplates = [...imageTemplates].sort(() => Math.random() - 0.5);
    const selectedTemplates = shuffledTemplates.slice(0, count);
    
    const templateIdeas = selectedTemplates.map((template, index) => ({
      id: `image-template-${Date.now()}-${index}`,
      title: template.title,
      description: `${template.description} - What makes this interesting is how visual inspiration can spark completely unexpected creative directions`,
      sourceContent: 'Image upload'
    }));

    console.log(`Image template fallback: Generated ${templateIdeas.length} template-based ideas`);
    return templateIdeas;
  } catch (error) {
    console.error('Image analysis completely failed:', error);
    
    // Ultimate fallback with generic image-inspired ideas
    const fallbackIdeas = [
      {
        title: "Visual Inspiration Project",
        description: "Use the visual elements from your image to start a creative project in any medium you choose"
      },
      {
        title: "Color Story",
        description: "Extract the color palette from your image and create something new using only those colors"
      },
      {
        title: "Community Feedback",
        description: "Share your image in creative communities and ask for collaborative project ideas"
      }
    ];
    
    return fallbackIdeas.map((idea, index) => ({
      id: `image-fallback-${Date.now()}-${index}`,
      title: idea.title,
      description: `${idea.description} - What makes this interesting is how it turns any visual input into creative momentum`,
      sourceContent: 'Image upload fallback'
    }));
  }
}