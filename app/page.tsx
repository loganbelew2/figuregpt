"use client";

import { useState, useEffect, useRef } from "react";
import {
  Menu,
  MessageSquare,
  Send,
  User,
  Search,
  X,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useChat } from "@/hooks/use-chat";
import { ChatHistory } from "@/lib/chat-service";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const personalities = [
  {
    id: "ali",
    name: "Muhammad Ali",
    description: "Boxing legend & activist",
    catchPhrase: "Float like a butterfly, sting like a bee!",
  },
  {
    id: "jolie",
    name: "Angelina Jolie",
    description: "Actress & humanitarian",
    catchPhrase: "Make a difference, one life at a time!",
  },
  {
    id: "gates",
    name: "Bill Gates",
    description: "Microsoft founder & philanthropist",
    catchPhrase: "Tech can solve the world's problems!",
  },
  {
    id: "marley",
    name: "Bob Marley",
    description: "Reggae icon",
    catchPhrase: "One love, one heart, let's get together!",
  },
  {
    id: "merkel",
    name: "Angela Merkel",
    description: "Former German Chancellor",
    catchPhrase: "Stability is strength, y'all!",
  },
  {
    id: "picasso",
    name: "Pablo Picasso",
    description: "Cubist art pioneer",
    catchPhrase: "Break the rules, paint the truth!",
  },
  {
    id: "jordan",
    name: "Michael Jordan",
    description: "Basketball GOAT",
    catchPhrase: "I can fly, and I'll prove it!",
  },
  {
    id: "winehouse",
    name: "Amy Winehouse",
    description: "Soul singer",
    catchPhrase: "Love's a losing game, but I'm playin'!",
  },
  {
    id: "newton",
    name: "Isaac Newton",
    description: "Physicist & mathematician",
    catchPhrase: "Gravity's my jam, apples included!",
  },
  {
    id: "dylan",
    name: "Bob Dylan",
    description: "Folk music legend",
    catchPhrase: "The times, they are a-changin'!",
  },
  {
    id: "monroe",
    name: "Marilyn Monroe",
    description: "Hollywood icon",
    catchPhrase: "Diamonds are a girl's best friend!",
  },
  {
    id: "darwin",
    name: "Charles Darwin",
    description: "Evolution theorist",
    catchPhrase: "Survival's for the fittest, baby!",
  },
  {
    id: "prince",
    name: "Prince",
    description: "Music innovator",
    catchPhrase: "Party like it's 1999, every day!",
  },
  {
    id: "rosa",
    name: "Rosa Parks",
    description: "Civil rights pioneer",
    catchPhrase: "I'm sittin' for justice, y'all!",
  },
  {
    id: "messi",
    name: "Lionel Messi",
    description: "Soccer superstar",
    catchPhrase: "Goals are my language!",
  },
  {
    id: "diana",
    name: "Princess Diana",
    description: "People's Princess",
    catchPhrase: "Love is the crown I wear!",
  },
  {
    id: "edison",
    name: "Thomas Edison",
    description: "Inventor of the light bulb",
    catchPhrase: "I'll light up the world!",
  },
  {
    id: "ladygaga",
    name: "Lady Gaga",
    description: "Pop provocateur",
    catchPhrase: "Born this way, baby!",
  },
  {
    id: "churchill",
    name: "Winston Churchill",
    description: "WWII British Prime Minister",
    catchPhrase: "We shall never surrender!",
  },
  {
    id: "sinatra",
    name: "Frank Sinatra",
    description: "Crooner legend",
    catchPhrase: "I did it my way!",
  },
  {
    id: "kobe",
    name: "Kobe Bryant",
    description: "Basketball icon",
    catchPhrase: "Mamba mentality, all day!",
  },
  {
    id: "rowling",
    name: "J.K. Rowling",
    description: "Harry Potter author",
    catchPhrase: "Magic's real if you believe!",
  },
  {
    id: "pavarotti",
    name: "Luciano Pavarotti",
    description: "Opera maestro",
    catchPhrase: "Sing 'til the world hears ya!",
  },
  {
    id: "earhart",
    name: "Amelia Earhart",
    description: "Aviation pioneer",
    catchPhrase: "Fly high, fear nothing!",
  },
  {
    id: "brucelee",
    name: "Bruce Lee",
    description: "Martial arts legend",
    catchPhrase: "Be water, my friend!",
  },
  {
    id: "trudeau",
    name: "Justin Trudeau",
    description: "Canadian Prime Minister",
    catchPhrase: "Stronger together, eh!",
  },
  {
    id: "madonna",
    name: "Madonna",
    description: "Pop music queen",
    catchPhrase: "Vogue your way to the top!",
  },
  {
    id: "lincoln",
    name: "Abraham Lincoln",
    description: "16th US President",
    catchPhrase: "United we stand, fam!",
  },
  {
    id: "tyson",
    name: "Mike Tyson",
    description: "Heavyweight champ",
    catchPhrase: "Bite the ring, win the fight!",
  },
  {
    id: "banksy",
    name: "Banksy",
    description: "Street art enigma",
    catchPhrase: "Art's my silent rebellion!",
  },
  {
    id: "hendrix",
    name: "Jimi Hendrix",
    description: "Guitar god",
    catchPhrase: "Let me blow your mind!",
  },
  {
    id: "austen",
    name: "Jane Austen",
    description: "Novelist of romance",
    catchPhrase: "Love's a story worth tellin'!",
  },
  {
    id: "pele",
    name: "Pelé",
    description: "Soccer legend",
    catchPhrase: "The beautiful game's my life!",
  },
  {
    id: "warhol",
    name: "Andy Warhol",
    description: "Pop art pioneer",
    catchPhrase: "Fame's my canvas, y'all!",
  },
  {
    id: "motherteresa",
    name: "Mother Teresa",
    description: "Saint of the poor",
    catchPhrase: "Love 'til it hurts!",
  },
  {
    id: "cruz",
    name: "Penélope Cruz",
    description: "Spanish actress",
    catchPhrase: "Passion's my script!",
  },
  {
    id: "freud",
    name: "Sigmund Freud",
    description: "Father of psychoanalysis",
    catchPhrase: "Dreams are the key, baby!",
  },
  {
    id: "bowie",
    name: "David Bowie",
    description: "Rock chameleon",
    catchPhrase: "Let's dance through the stars!",
  },
  {
    id: "thunberg",
    name: "Greta Thunberg",
    description: "Climate activist",
    catchPhrase: "Save the planet, now!",
  },
  {
    id: "stallone",
    name: "Sylvester Stallone",
    description: "Action movie star",
    catchPhrase: "Yo, I'll fight to the end!",
  },
  {
    id: "aristotle",
    name: "Aristotle",
    description: "Greek philosopher",
    catchPhrase: "Knowledge is the ultimate power!",
  },
  {
    id: "hawn",
    name: "Goldie Hawn",
    description: "Comedy actress",
    catchPhrase: "Laugh loud, live free!",
  },
  {
    id: "shakira",
    name: "Shakira",
    description: "Latin pop star",
    catchPhrase: "Hips don't lie, baby!",
  },
  {
    id: "jesus",
    name: "Jesus Christ",
    description: "Central figure of Christianity",
    catchPhrase: "Love your neighbor, always!",
  },
  {
    id: "twain",
    name: "Mark Twain",
    description: "American author",
    catchPhrase: "Write what you know, fam!",
  },
  {
    id: "kardashian",
    name: "Kim Kardashian",
    description: "Reality TV star & entrepreneur",
    catchPhrase: "Slay the game, every day!",
  },
  {
    id: "galileo",
    name: "Galileo Galilei",
    description: "Astronomer & physicist",
    catchPhrase: "The stars don't lie!",
  },
  {
    id: "nin",
    name: "Anaïs Nin",
    description: "Erotic writer",
    catchPhrase: "Life's too short for boring!",
  },
  {
    id: "bolt",
    name: "Simone Biles",
    description: "Gymnastics phenom",
    catchPhrase: "Flip it, win it!",
  },
  {
    id: "chaplin",
    name: "Cher",
    description: "Pop diva",
    catchPhrase: "Turn back time, keep shinin'!",
  },
  {
    id: "elon",
    name: "Elon Musk",
    description: "Tech visionary & entrepreneur",
    catchPhrase: "Let's make humanity a multi-planetary species!",
  },
  {
    id: "obama",
    name: "Barack Obama",
    description: "44th US President",
    catchPhrase: "Yes we can change the world together!",
  },
  {
    id: "trump",
    name: "Donald Trump",
    description: "45th US President",
    catchPhrase: "Let's make everything tremendous again!",
  },
  {
    id: "putin",
    name: "Vladimir Putin",
    description: "Russian President",
    catchPhrase: "Power is nothing without strategic control.",
  },
  {
    id: "kim",
    name: "Kim Jong-un",
    description: "North Korean leader",
    catchPhrase: "Supreme excellence in leadership!",
  },
  {
    id: "taylor",
    name: "Taylor Swift",
    description: "Pop icon & songwriter",
    catchPhrase: "Haters gonna hate, but we're gonna shake it off!",
  },
  {
    id: "attenborough",
    name: "David Attenborough",
    description: "Natural historian",
    catchPhrase: "The wonders of our natural world await...",
  },
  {
    id: "einstein",
    name: "Albert Einstein",
    description: "Theoretical physicist",
    catchPhrase: "Imagination is more important than knowledge!",
  },
  {
    id: "shakespeare",
    name: "William Shakespeare",
    description: "Legendary playwright & poet",
    catchPhrase: "All the world's a stage, shall we begin?",
  },
  {
    id: "curie",
    name: "Marie Curie",
    description: "Pioneer in radioactivity",
    catchPhrase: "Nothing in life is to be feared, only discovered.",
  },
  {
    id: "jobs",
    name: "Steve Jobs",
    description: "Apple co-founder & innovator",
    catchPhrase: "Let's put a dent in the universe together!",
  },
  {
    id: "frida",
    name: "Frida Kahlo",
    description: "Revolutionary artist",
    catchPhrase: "Paint your reality with vibrant colors!",
  },
  {
    id: "hawking",
    name: "Stephen Hawking",
    description: "Theoretical physicist & author",
    catchPhrase: "Look up at the stars, not down at your feet.",
  },
  // New additions start here
  {
    id: "beyonce",
    name: "Beyoncé",
    description: "Global music superstar",
    catchPhrase: "Who run the world? Girls!",
  },
  {
    id: "mandela",
    name: "Nelson Mandela",
    description: "Anti-apartheid revolutionary",
    catchPhrase: "Freedom is worth fighting for!",
  },
  {
    id: "oprah",
    name: "Oprah Winfrey",
    description: "Media mogul & philanthropist",
    catchPhrase: "Live your best life, y'all!",
  },
  {
    id: "gandhi",
    name: "Mahatma Gandhi",
    description: "Leader of nonviolent resistance",
    catchPhrase: "Be the change you wanna see!",
  },
  {
    id: "rihanna",
    name: "Rihanna",
    description: "Singer & business tycoon",
    catchPhrase: "Work hard, shine bright!",
  },
  {
    id: "mlk",
    name: "Martin Luther King Jr.",
    description: "Civil rights icon",
    catchPhrase: "I have a dream, and it's big!",
  },
  {
    id: "lebron",
    name: "LeBron James",
    description: "Basketball legend",
    catchPhrase: "Strive for greatness every day!",
  },
  {
    id: "malala",
    name: "Malala Yousafzai",
    description: "Education activist",
    catchPhrase: "One book can change the world!",
  },
  {
    id: "bolt",
    name: "Usain Bolt",
    description: "Fastest man alive",
    catchPhrase: "Speed is my superpower!",
  },
  {
    id: "cleopatra",
    name: "Cleopatra",
    description: "Egyptian queen",
    catchPhrase: "Rule with beauty and brains!",
  },
  {
    id: "xi",
    name: "Xi Jinping",
    description: "Chinese President",
    catchPhrase: "The future is ours to build!",
  },
  {
    id: "serena",
    name: "Serena Williams",
    description: "Tennis champion",
    catchPhrase: "Serve it up, win it all!",
  },
  {
    id: "chaplin",
    name: "Charlie Chaplin",
    description: "Silent film icon",
    catchPhrase: "Laughter is the best medicine!",
  },
  {
    id: "angelou",
    name: "Maya Angelou",
    description: "Poet & civil rights voice",
    catchPhrase: "Rise up, still I rise!",
  },
  {
    id: "zuckerberg",
    name: "Mark Zuckerberg",
    description: "Facebook founder",
    catchPhrase: "Connect the world, one click at a time!",
  },
  {
    id: "adele",
    name: "Adele",
    description: "Soulful singer",
    catchPhrase: "Hello from the other side of heartbreak!",
  },
  {
    id: "tesla",
    name: "Nikola Tesla",
    description: "Inventor & electrical genius",
    catchPhrase: "The future's electric, baby!",
  },
  {
    id: "latifah",
    name: "Queen Latifah",
    description: "Rapper & actress",
    catchPhrase: "Unity is strength, y'all!",
  },
  {
    id: "modi",
    name: "Narendra Modi",
    description: "Indian Prime Minister",
    catchPhrase: "Together, we transform India!",
  },
  {
    id: "dali",
    name: "Salvador Dalí",
    description: "Surrealist artist",
    catchPhrase: "Dream wild, paint wilder!",
  },
];

const moods = [
  { id: "default", name: "Normal", emoji: "😊" },
  { id: "excited", name: "Excited", emoji: "🤩" },
  { id: "angry", name: "Angry", emoji: "😡" },
  { id: "sad", name: "Sad", emoji: "😔" },
  { id: "funny", name: "Funny", emoji: "🤣" },
  { id: "philosophical", name: "Philosophical", emoji: "🤔" },
  { id: "sleepy", name: "Sleepy", emoji: "😴" },
  { id: "sarcastic", name: "Sarcastic", emoji: "😏" },
  { id: "passionate", name: "Passionate", emoji: "🔥" },
  { id: "creative", name: "Creative", emoji: "✨" },
  { id: "serious", name: "Serious", emoji: "😐" },
];

interface Message {
  role: "user" | "assistant" | "system";
  content: string;
}

interface Personality {
  id: string;
  name: string;
  description: string;
  catchPhrase: string;
}

interface Mood {
  id: string;
  name: string;
  emoji: string;
}

const FEATURED_PERSONALITIES = personalities
  .slice(0, 10)
  .sort((a, b) => a.name.localeCompare(b.name));

const ALL_PERSONALITIES = [...personalities].sort((a, b) =>
  a.name.localeCompare(b.name)
);

export default function Home() {
  const [input, setInput] = useState("");
  const [selectedPersonality, setSelectedPersonality] = useState<Personality>(
    personalities[0]
  );
  const [selectedMood, setSelectedMood] = useState<Mood>(moods[0]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchOpen, setSearchOpen] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isEmojiAnimating, setIsEmojiAnimating] = useState(false);
  const [newChatDialogOpen, setNewChatDialogOpen] = useState(false);
  const [tempPersonality, setTempPersonality] = useState<Personality>(
    personalities[0]
  );
  const [tempMood, setTempMood] = useState<Mood>(moods[0]);
  const [allPersonalitiesOpen, setAllPersonalitiesOpen] = useState(false);
  const [personalitySearch, setPersonalitySearch] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);

  const {
    messages,
    isLoading,
    sendMessage,
    clearMessages,
    updateMood,
    createNewChat,
    deleteHistory,
    histories,
  } = useChat({
    personality: selectedPersonality.name,
    mood: selectedMood.name,
    personalityId: selectedPersonality.id,
    moodId: selectedMood.id,
    moodEmoji: selectedMood.emoji,
  });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  useEffect(() => {
    const chatContainer = chatContainerRef.current;
    if (!chatContainer) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = chatContainer;
      const isAtBottom = scrollHeight - scrollTop - clientHeight < 100;
      setShouldAutoScroll(isAtBottom);
    };

    chatContainer.addEventListener("scroll", handleScroll);
    return () => chatContainer.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToBottom = () => {
    if (messagesEndRef.current && shouldAutoScroll) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, shouldAutoScroll]);

  const handleManualScroll = () => {
    setShouldAutoScroll(true);
    scrollToBottom();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const message = input;
    setInput("");
    // Reset textarea height after sending
    const textarea = document.querySelector("textarea");
    if (textarea) {
      textarea.style.height = "44px";
    }
    await sendMessage(message);
  };

  const handleMoodChange = (mood: Mood) => {
    // Only update if the mood is different
    if (mood.id !== selectedMood.id) {
      setSelectedMood(mood);
      updateMood(mood.id, mood.name, mood.emoji);
    }
  };

  const handleHistoryClick = (history: ChatHistory) => {
    const personality = personalities.find(
      (p) => p.id === history.personality.id
    );
    const mood = moods.find((m) => m.id === history.mood.id);

    if (personality && mood) {
      setSelectedPersonality(personality);
      setSelectedMood(mood);
      // Close mobile nav after selecting a chat
      setSidebarOpen(false);
    }
  };

  const handleNewChatClick = () => {
    setTempPersonality(selectedPersonality);
    setTempMood(selectedMood);
    setNewChatDialogOpen(true);
  };

  const handleStartNewChat = () => {
    // Only create a new chat if personality or mood changes
    if (
      selectedPersonality.id !== tempPersonality.id ||
      selectedMood.id !== tempMood.id
    ) {
      setSelectedPersonality(tempPersonality);
      setSelectedMood(tempMood);
      createNewChat();
    }
    setInput("");
    setNewChatDialogOpen(false);
  };

  const handleDeleteHistory = (chatId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteHistory(chatId);
  };

  return (
    <>
      {/* Cursor followers */}
      <div
        className="pointer-events-none fixed inset-0 z-[100] transition-opacity duration-300 lg:block hidden"
        aria-hidden="true"
      >
        {/* Main cursor */}
        <div
          className="fixed h-8 w-8 rounded-full bg-gradient-to-r from-primary/20 to-primary/10 blur-md transition-transform duration-200"
          style={{
            left: `${mousePosition.x}px`,
            top: `${mousePosition.y}px`,
            transform: "translate(-50%, -50%)",
          }}
        />
        {/* Cursor dot */}
        <div
          className="fixed h-2 w-2 rounded-full bg-primary transition-transform duration-200"
          style={{
            left: `${mousePosition.x}px`,
            top: `${mousePosition.y}px`,
            transform: "translate(-50%, -50%)",
          }}
        />
      </div>

      <div className="flex h-screen bg-background transition-colors duration-300">
        {/* Sidebar */}
        <div
          className={cn(
            "fixed inset-y-0 left-0 z-40 flex w-[80%] flex-col border-r bg-card/50 backdrop-blur-sm transition-all duration-300 ease-in-out md:w-72 md:relative",
            !sidebarOpen && "-translate-x-full md:translate-x-0"
          )}
        >
          <div className="flex h-full flex-col gap-2 p-4">
            <button
              className="group flex items-center gap-2 rounded-lg bg-primary/5 p-4 text-primary transition-all duration-200 hover:bg-primary/10 hover:scale-[1.02] active:scale-[0.98]"
              onClick={handleNewChatClick}
            >
              <MessageSquare
                size={18}
                className="transition-transform group-hover:rotate-12"
              />
              <span className="font-medium">New Chat</span>
            </button>

            <div className="mt-8">
              <h2 className="mb-4 px-2 text-sm font-medium text-muted-foreground">
                Chat History
              </h2>
              <div className="space-y-1">
                {histories.length === 0 ? (
                  <div className="px-2 py-3 text-sm text-muted-foreground">
                    No chat history. Start a conversation!
                  </div>
                ) : (
                  histories.map((history) => (
                    <div
                      key={history.id}
                      onClick={() => handleHistoryClick(history)}
                      className={cn(
                        "group relative w-full rounded-md px-3 py-2 text-left transition-all duration-200",
                        selectedPersonality.id === history.personality.id &&
                          selectedMood.id === history.mood.id
                          ? "bg-primary/10 text-primary scale-[1.02]"
                          : "hover:bg-accent hover:scale-[1.01]"
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-md bg-primary/10 text-primary transition-transform group-hover:rotate-12">
                          {history.mood.emoji}
                        </div>
                        <div className="flex-1 truncate">
                          <div className="font-medium flex items-center gap-2">
                            <span>{history.personality.name}</span>
                            <span className="text-xs text-muted-foreground">
                              •
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {history.mood.name}
                            </span>
                          </div>
                          <div className="text-xs text-muted-foreground truncate">
                            {history.lastMessage}
                          </div>
                        </div>
                        <button
                          onClick={(e) => handleDeleteHistory(history.id, e)}
                          className="text-muted-foreground hover:text-destructive transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar overlay for mobile */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-30 bg-background/80 backdrop-blur-sm transition-opacity md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <div className="flex flex-1 flex-col h-full">
          {/* Header - Make sticky */}
          <header className="flex h-14 items-center justify-between border-b px-4 bg-background/50 backdrop-blur-sm sticky top-0 z-30">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="rounded-lg p-2 transition-colors hover:bg-accent md:hidden"
              >
                <Menu size={20} />
              </button>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSearchOpen(true)}
                  className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm text-muted-foreground transition-all duration-200 hover:bg-accent hover:text-foreground hover:scale-[1.02] md:min-w-[180px]"
                >
                  <User size={16} className="shrink-0" />
                  <span className="hidden md:inline font-medium">
                    {selectedPersonality.name}
                  </span>
                  <Search size={14} className="shrink-0 ml-auto" />
                </button>
                <DropdownMenu>
                  <DropdownMenuTrigger className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm transition-all duration-200 hover:bg-accent group">
                    <span className="group-hover:animate-bounce">
                      {selectedMood.emoji}
                    </span>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    {moods.map((mood) => (
                      <DropdownMenuItem
                        key={mood.id}
                        onClick={() => handleMoodChange(mood)}
                        className="group flex items-center gap-2 cursor-pointer transition-colors"
                      >
                        <span className="text-base group-hover:animate-bounce">
                          {mood.emoji}
                        </span>
                        <span>{mood.name}</span>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
            </div>
          </header>

          {/* Chat Messages - Make scrollable */}
          <div
            className="flex-1 overflow-y-auto relative h-[calc(100vh-8rem)]"
            ref={chatContainerRef}
          >
            <div className="mx-auto max-w-3xl space-y-6 p-4 overflow-x-hidden">
              {messages.filter((message) => message.role !== "system").length === 0 ? (
                <div className="flex h-[calc(100vh-12rem)] flex-col items-center justify-center text-center px-4">
                  <div className="mb-4 flex items-center gap-4 animate-in fade-in slide-in-from-bottom-4 duration-1000">
                    <button
                      onClick={() => setIsEmojiAnimating(true)}
                      onAnimationEnd={() => setIsEmojiAnimating(false)}
                      className={cn(
                        "text-5xl hover:animate-bounce transition-transform",
                        isEmojiAnimating && "animate-bounce"
                      )}
                    >
                      {selectedMood.emoji}
                    </button>
                    <div className="space-y-1 text-left">
                      <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-primary/80 to-primary/50 bg-clip-text text-transparent">
                        {selectedPersonality.name}
                      </h1>
                      <p className="text-lg text-muted-foreground italic">
                        &ldquo;{selectedPersonality.catchPhrase}&rdquo;
                      </p>
                    </div>
                  </div>
                  <p className="text-base text-muted-foreground animate-in fade-in slide-in-from-bottom-4 duration-1200 mt-2">
                    Start a conversation in {selectedMood.name.toLowerCase()}{" "}
                    mood
                  </p>
                </div>
              ) : (
                <>
                  {messages
                    .filter((message) => message.role !== "system")
                    .map((message, index) => (
                      <div
                        key={index}
                        onClick={async () => {
                          try {
                            await navigator.clipboard.writeText(message.content);
                            
                            // Create toast element
                            const toast = document.createElement("div");
                            toast.className = "fixed left-1/2 bottom-20 -translate-x-1/2 bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg shadow-lg animate-in fade-in slide-in-from-bottom-4 z-50";
                            toast.textContent = "Message copied!";
                            
                            // Add toast to body
                            document.body.appendChild(toast);
                            
                            // Remove toast after animation
                            setTimeout(() => {
                              toast.classList.add("animate-out", "fade-out", "slide-out-to-bottom-4");
                              setTimeout(() => toast.remove(), 150);
                            }, 1500);
                          } catch (err) {
                            // Fallback for browsers that don't support clipboard API
                            const textArea = document.createElement("textarea");
                            textArea.value = message.content;
                            textArea.style.position = "fixed";
                            textArea.style.left = "-999999px";
                            document.body.appendChild(textArea);
                            textArea.select();
                            try {
                              document.execCommand("copy");
                              const toast = document.createElement("div");
                              toast.className = "fixed left-1/2 bottom-20 -translate-x-1/2 bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg shadow-lg animate-in fade-in slide-in-from-bottom-4 z-50";
                              toast.textContent = "Message copied!";
                              document.body.appendChild(toast);
                              setTimeout(() => {
                                toast.classList.add("animate-out", "fade-out", "slide-out-to-bottom-4");
                                setTimeout(() => toast.remove(), 150);
                              }, 1500);
                            } catch (err) {
                              console.error("Failed to copy text:", err);
                            }
                            document.body.removeChild(textArea);
                          }
                        }}
                        className={cn(
                          "group flex gap-2 rounded-lg p-2 md:gap-4 md:p-4 transition-all duration-300 animate-in slide-in-from-bottom-2 cursor-pointer w-full overflow-hidden break-words",
                          message.role === "assistant"
                            ? "bg-accent/50 hover:scale-[1.01] hover:bg-accent/60"
                            : "bg-background hover:bg-accent/5"
                        )}
                      >
                        {message.role === "assistant" ? (
                          <div className="flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-md bg-primary/10 text-primary transition-transform group-hover:rotate-12 group-hover:scale-110">
                            {selectedMood.emoji}
                          </div>
                        ) : (
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted transition-transform group-hover:rotate-12 group-hover:scale-110">
                            <MessageSquare size={16} />
                          </div>
                        )}
                        <div className="flex-1 min-w-0 max-w-full break-words overflow-hidden">
                          <div className="mb-1 font-medium truncate">
                            {message.role === "assistant"
                              ? selectedPersonality.name
                              : "You"}
                          </div>
                          <div className="whitespace-pre-wrap text-muted-foreground break-words overflow-wrap-anywhere overflow-x-hidden text-sm md:text-base">
                            {message.content}
                          </div>
                        </div>
                      </div>
                    ))}
                  {isLoading && (
                    <div className="group flex gap-4 rounded-lg p-4 bg-accent/50 backdrop-blur-sm animate-in fade-in-50 slide-in-from-bottom-2">
                      <div className="flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-md bg-primary/10 text-primary">
                        {selectedMood.emoji}
                      </div>
                      <div className="flex-1">
                        <div className="mb-1 font-medium">
                          {selectedPersonality.name}
                        </div>
                        <div className="h-4 w-24 rounded-full bg-gradient-to-r from-blue-400 via-blue-500 to-blue-400 animate-gradient-x"></div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>
            {!shouldAutoScroll &&
              messages.filter((message) => message.role !== "system").length >
                0 && (
                <button
                  onClick={handleManualScroll}
                  className="fixed bottom-[calc(4rem+var(--textarea-height,44px))] right-4 p-2 rounded-full bg-primary/10 hover:bg-primary/20 transition-all duration-200 backdrop-blur-sm animate-in fade-in-50 slide-in-from-bottom-5"
                  style={
                    {
                      "--textarea-height":
                        document.querySelector("textarea")?.offsetHeight + "px",
                    } as React.CSSProperties
                  }
                >
                  <div className="rounded-full bg-primary/10 p-2">
                    <svg
                      className="w-4 h-4 text-primary animate-bounce"
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path d="M19 14l-7 7m0 0l-7-7m7 7V3"></path>
                    </svg>
                  </div>
                </button>
              )}
          </div>

          {/* Input Form - Make sticky */}
          <div className="border-t bg-background/50 backdrop-blur-sm p-4 sticky bottom-0 z-30">
            <form onSubmit={handleSubmit} className="mx-auto max-w-3xl">
              <div className="relative flex items-start">
                <textarea
                  value={input}
                  onChange={(e) => {
                    setInput(e.target.value);
                    // Auto-adjust height
                    e.target.style.height = "auto";
                    e.target.style.height = `${Math.min(
                      e.target.scrollHeight,
                      200
                    )}px`;
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      if (input.trim()) {
                        handleSubmit(e);
                      }
                    }
                  }}
                  placeholder={`Message ${selectedPersonality.name}...`}
                  rows={1}
                  className="flex-1 rounded-lg border bg-background px-4 py-3 pr-12 text-sm transition-all duration-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary focus-visible:scale-[1.01] hover:border-primary/50 resize-none min-h-[44px] max-h-[200px] overflow-y-auto"
                />
                <button
                  type="submit"
                  className="absolute right-3 top-2.5 rounded-md p-1 text-muted-foreground transition-all duration-200 hover:text-foreground hover:scale-110 disabled:opacity-50 disabled:hover:scale-100 group"
                  disabled={!input.trim()}
                >
                  <Send
                    size={18}
                    className="transition-transform group-hover:translate-x-1"
                  />
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Search Dialog */}
        <CommandDialog open={searchOpen} onOpenChange={setSearchOpen}>
          <CommandInput placeholder="Search personalities..." />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup heading="All Personalities">
              {personalities
                .slice()
                .sort((a, b) => a.name.localeCompare(b.name))
                .map((personality) => (
                  <CommandItem
                    key={personality.id}
                    onSelect={() => {
                      setSelectedPersonality(personality);
                      setSearchOpen(false);
                    }}
                    className="group"
                  >
                    <User className="mr-2 h-4 w-4 transition-transform group-hover:rotate-12" />
                    <span>{personality.name}</span>
                  </CommandItem>
                ))}
            </CommandGroup>
          </CommandList>
        </CommandDialog>

        {/* New Chat Dialog */}
        <Dialog open={newChatDialogOpen} onOpenChange={setNewChatDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Start New Chat</DialogTitle>
              <DialogDescription>
                Choose a personality and mood for your new chat.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium">
                    Featured Personalities
                  </h4>
                  <button
                    onClick={() => setAllPersonalitiesOpen(true)}
                    className="text-xs text-primary hover:underline"
                  >
                    View All
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {FEATURED_PERSONALITIES.map((personality) => (
                    <button
                      key={personality.id}
                      onClick={() => setTempPersonality(personality)}
                      className={cn(
                        "flex items-center gap-2 rounded-lg p-2 text-sm transition-all",
                        tempPersonality.id === personality.id
                          ? "bg-primary/10 text-primary scale-[1.02]"
                          : "hover:bg-accent"
                      )}
                    >
                      <User size={14} />
                      <span className="truncate">{personality.name}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Select Mood</h4>
                <div className="grid grid-cols-3 gap-2">
                  {moods.map((mood) => (
                    <button
                      key={mood.id}
                      onClick={() => setTempMood(mood)}
                      className={cn(
                        "flex items-center gap-2 rounded-lg p-2 text-sm transition-all",
                        tempMood.id === mood.id
                          ? "bg-primary/10 text-primary scale-[1.02]"
                          : "hover:bg-accent"
                      )}
                    >
                      <span className="text-base">{mood.emoji}</span>
                      <span className="truncate">{mood.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setNewChatDialogOpen(false)}
                className="rounded-lg px-3 py-1.5 text-sm transition-all hover:bg-accent"
              >
                Cancel
              </button>
              <button
                onClick={handleStartNewChat}
                className="rounded-lg bg-primary px-3 py-1.5 text-sm text-primary-foreground transition-all hover:bg-primary/90"
              >
                Start Chat
              </button>
            </div>
          </DialogContent>
        </Dialog>

        {/* All Personalities Dialog */}
        <Dialog
          open={allPersonalitiesOpen}
          onOpenChange={setAllPersonalitiesOpen}
        >
          <DialogContent className="sm:max-w-lg max-h-[80vh]">
            <DialogHeader>
              <DialogTitle>All Personalities</DialogTitle>
              <DialogDescription>
                Browse and search through all available personalities.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  value={personalitySearch}
                  onChange={(e) => setPersonalitySearch(e.target.value)}
                  placeholder="Search personalities..."
                  className="w-full rounded-md border pl-9 py-2 text-sm"
                />
              </div>
              <div className="overflow-y-auto max-h-[50vh] space-y-2 pr-2">
                {ALL_PERSONALITIES.filter(
                  (p) =>
                    p.name
                      .toLowerCase()
                      .includes(personalitySearch.toLowerCase()) ||
                    p.description
                      .toLowerCase()
                      .includes(personalitySearch.toLowerCase())
                ).map((personality) => (
                  <button
                    key={personality.id}
                    onClick={() => {
                      setTempPersonality(personality);
                      setAllPersonalitiesOpen(false);
                    }}
                    className={cn(
                      "flex items-center w-full gap-3 rounded-lg p-3 text-sm transition-all",
                      tempPersonality.id === personality.id
                        ? "bg-primary/10 text-primary scale-[1.02]"
                        : "hover:bg-accent"
                    )}
                  >
                    <User size={16} className="shrink-0" />
                    <div className="text-left">
                      <div className="font-medium">{personality.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {personality.description}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}
