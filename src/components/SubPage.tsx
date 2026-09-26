interface SubPageProps {
  page: string;
  lang: "en" | "bn";
}

const content: Record<string, { en: React.ReactNode; bn: React.ReactNode }> = {
  home: {
    en: (
      <div className="subpage">
        <h1>Welcome to StudyZone AI</h1>
        <p className="subpage-header">Your intelligent learning companion powered by open-source AI</p>

        <h2>What can StudyZone AI do?</h2>
        <div className="feature-card">
          <h3>📚 Answer Any Question</h3>
          <p>From quantum physics to history, mathematics to literature — ask anything and get detailed, accurate answers instantly.</p>
        </div>
        <div className="feature-card">
          <h3>🧠 Deep Explanations</h3>
          <p>StudyZone AI breaks down complex topics into understandable pieces, with examples and step-by-step reasoning.</p>
        </div>
        <div className="feature-card">
          <h3>💻 Code Help</h3>
          <p>Get help writing, debugging, and understanding code in any programming language with detailed explanations.</p>
        </div>
        <div className="feature-card">
          <h3>🌐 Bangla & English</h3>
          <p>Switch between Bangla and English seamlessly. Get responses in your preferred language with one click.</p>
        </div>
        <div className="feature-card">
          <h3>🎤 Voice & Camera Input</h3>
          <p>Use your microphone to speak your question, or point your camera at a problem to get instant AI help.</p>
        </div>
        <div className="feature-card">
          <h3>📁 File Analysis</h3>
          <p>Upload documents, PDFs, and images for the AI to read and analyze alongside your questions.</p>
        </div>

        <h2>Supported AI Models</h2>
        <div className="feature-card">
          <h3>🦙 Llama 3</h3>
          <p>Meta's powerful open-source language model — excellent for general knowledge, writing, and reasoning tasks.</p>
        </div>
        <div className="feature-card">
          <h3>🌪 Mistral AI</h3>
          <p>Fast and efficient European AI model with strong performance in math, coding, and multilingual tasks.</p>
        </div>
        <div className="feature-card">
          <h3>💎 Gemma AI</h3>
          <p>Google's lightweight open model optimized for conversational AI and educational content generation.</p>
        </div>
      </div>
    ),
    bn: (
      <div className="subpage">
        <h1>StudyZone AI-তে স্বাগতম</h1>
        <p className="subpage-header">ওপেন-সোর্স AI দ্বারা চালিত আপনার বুদ্ধিমান শেখার সঙ্গী</p>

        <h2>StudyZone AI কী করতে পারে?</h2>
        <div className="feature-card">
          <h3>📚 যেকোনো প্রশ্নের উত্তর দিন</h3>
          <p>কোয়ান্টাম পদার্থবিজ্ঞান থেকে ইতিহাস, গণিত থেকে সাহিত্য — যেকোনো কিছু জিজ্ঞেস করুন এবং তাৎক্ষণিক উত্তর পান।</p>
        </div>
        <div className="feature-card">
          <h3>🧠 গভীর ব্যাখ্যা</h3>
          <p>StudyZone AI জটিল বিষয়গুলিকে সহজবোধ্য অংশে ভেঙে দেয়, উদাহরণ এবং ধাপে ধাপে যুক্তি সহ।</p>
        </div>
        <div className="feature-card">
          <h3>💻 কোড সহায়তা</h3>
          <p>বিস্তারিত ব্যাখ্যা সহ যেকোনো প্রোগ্রামিং ভাষায় কোড লেখা, ডিবাগিং এবং বোঝার জন্য সাহায্য নিন।</p>
        </div>
        <div className="feature-card">
          <h3>🌐 বাংলা ও ইংরেজি</h3>
          <p>বাংলা এবং ইংরেজির মধ্যে অনায়াসে স্যুইচ করুন। এক ক্লিকে আপনার পছন্দের ভাষায় উত্তর পান।</p>
        </div>
      </div>
    ),
  },
  faq: {
    en: (
      <div className="subpage">
        <h1>Frequently Asked Questions</h1>
        <p className="subpage-header">Everything you need to know about StudyZone AI</p>

        <h2>General</h2>
        <div className="feature-card">
          <h3>What is StudyZone AI?</h3>
          <p>StudyZone AI is an intelligent learning platform powered by open-source AI models including Llama 3, Mistral AI, and Gemma. It helps students and learners with questions across all subjects.</p>
        </div>
        <div className="feature-card">
          <h3>Is it free to use?</h3>
          <p>Yes! StudyZone AI is free to use. Create an account to save your chat history and access all features.</p>
        </div>
        <div className="feature-card">
          <h3>Do I need to create an account?</h3>
          <p>You can start chatting without an account. However, signing in lets you save chat history, continue previous conversations, and sync across devices.</p>
        </div>

        <h2>Features</h2>
        <div className="feature-card">
          <h3>How do I switch between Bangla and English?</h3>
          <p>Use the language toggle (EN / বাং) at the top of the page. Selecting Bangla will translate AI responses into Bangla automatically.</p>
        </div>
        <div className="feature-card">
          <h3>Can I upload files?</h3>
          <p>Yes! Click the file icon in the input area to upload documents, images, and PDFs for the AI to analyze.</p>
        </div>
        <div className="feature-card">
          <h3>How do I use voice input?</h3>
          <p>Click the microphone icon in the input area to speak your question. The AI will process your voice and respond accordingly.</p>
        </div>
        <div className="feature-card">
          <h3>Can I delete my chat history?</h3>
          <p>Yes. Open the sidebar and click the trash icon next to any chat to delete it individually, or use "Clear All History" at the bottom to remove everything.</p>
        </div>
        <div className="feature-card">
          <h3>Which AI model should I choose?</h3>
          <p>Llama 3 is great for general questions. Mistral AI excels at math and coding. Gemma is ideal for conversational learning. Try different models to see which works best for you!</p>
        </div>

        <h2>Privacy & Data</h2>
        <div className="feature-card">
          <h3>Is my data safe?</h3>
          <p>Your chat history is stored locally in your browser. We do not store your conversations on our servers beyond what's needed to process your request.</p>
        </div>
      </div>
    ),
    bn: (
      <div className="subpage">
        <h1>সচরাচর জিজ্ঞাসিত প্রশ্ন</h1>
        <p className="subpage-header">StudyZone AI সম্পর্কে আপনার জানার সব কিছু</p>

        <div className="feature-card">
          <h3>StudyZone AI কী?</h3>
          <p>StudyZone AI হলো একটি বুদ্ধিমান শেখার প্ল্যাটফর্ম যা Llama 3, Mistral AI এবং Gemma সহ ওপেন-সোর্স AI মডেল দ্বারা চালিত।</p>
        </div>
        <div className="feature-card">
          <h3>এটি কি বিনামূল্যে ব্যবহার করা যায়?</h3>
          <p>হ্যাঁ! StudyZone AI বিনামূল্যে ব্যবহার করা যায়। চ্যাট ইতিহাস সংরক্ষণ করতে একটি অ্যাকাউন্ট তৈরি করুন।</p>
        </div>
        <div className="feature-card">
          <h3>বাংলায় কীভাবে উত্তর পাব?</h3>
          <p>পৃষ্ঠার উপরে ভাষা টগল (EN / বাং) ব্যবহার করুন। বাংলা নির্বাচন করলে AI উত্তর স্বয়ংক্রিয়ভাবে বাংলায় অনুবাদ হবে।</p>
        </div>
      </div>
    ),
  },
  privacy: {
    en: (
      <div className="subpage">
        <h1>Privacy Policy</h1>
        <p className="subpage-header">Last updated: June 2025</p>

        <p>StudyZone AI ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, and safeguard your information when you use our service.</p>

        <h2>Information We Collect</h2>
        <p>We collect the following types of information:</p>
        <ul>
          <li><strong>Account Information:</strong> Email address and name when you register.</li>
          <li><strong>Chat Data:</strong> Messages you send and receive are processed to generate AI responses. Chat history is stored locally in your browser.</li>
          <li><strong>Usage Data:</strong> Anonymous usage statistics to improve our service (page views, feature usage).</li>
          <li><strong>Files:</strong> Files you upload are processed by the AI and are not permanently stored on our servers.</li>
        </ul>

        <h2>How We Use Your Information</h2>
        <ul>
          <li>To provide and improve the AI chat service</li>
          <li>To maintain your account and preferences</li>
          <li>To respond to support requests</li>
          <li>To send service-related communications (if opted in)</li>
        </ul>

        <h2>Data Storage</h2>
        <p>Chat history is stored in your browser's local storage. We do not store your conversations on our servers after the session ends.</p>

        <h2>Third-Party Services</h2>
        <p>We use the following third-party services:</p>
        <ul>
          <li><strong>Open-source AI models:</strong> Llama 3 (Meta), Mistral AI, Gemma (Google) for generating responses</li>
        </ul>

        <h2>Your Rights</h2>
        <p>You have the right to access, correct, or delete your personal data. To exercise these rights, contact us or delete your account from the Settings page.</p>

        <h2>Contact</h2>
        <p>For privacy concerns, contact us at privacy@studyzone.ai</p>
      </div>
    ),
    bn: (
      <div className="subpage">
        <h1>গোপনীয়তা নীতি</h1>
        <p className="subpage-header">সর্বশেষ আপডেট: জুন ২০২৫</p>
        <p>StudyZone AI আপনার গোপনীয়তা রক্ষায় প্রতিশ্রুতিবদ্ধ। এই গোপনীয়তা নীতিটি ব্যাখ্যা করে যে আমরা কীভাবে আপনার তথ্য সংগ্রহ, ব্যবহার এবং সুরক্ষিত করি।</p>
        <h2>আমরা কী তথ্য সংগ্রহ করি</h2>
        <ul>
          <li>অ্যাকাউন্ট তথ্য: ইমেইল ঠিকানা এবং নাম</li>
          <li>চ্যাট ডেটা: আপনার বার্তাগুলি AI উত্তর তৈরি করতে প্রক্রিয়া করা হয়</li>
          <li>ব্যবহারের তথ্য: পরিষেবা উন্নত করতে বেনামী পরিসংখ্যান</li>
        </ul>
        <h2>যোগাযোগ</h2>
        <p>গোপনীয়তা সংক্রান্ত উদ্বেগের জন্য: privacy@studyzone.ai</p>
      </div>
    ),
  },
  about: {
    en: (
      <div className="subpage">
        <h1>About StudyZone AI</h1>
        <p className="subpage-header">Democratizing education through open-source AI</p>

        <p>StudyZone AI was built with a simple mission: make high-quality AI-powered education accessible to everyone, especially students in Bangladesh and South Asia who deserve world-class learning tools.</p>

        <h2>Our Mission</h2>
        <p>We believe that every student, regardless of their location or economic background, deserves access to a knowledgeable tutor available 24/7. StudyZone AI makes this possible through cutting-edge open-source AI technology.</p>

        <h2>Why Open Source?</h2>
        <div className="feature-card">
          <h3>Transparency</h3>
          <p>Open-source models allow the community to understand and verify how the AI works, ensuring trustworthy responses.</p>
        </div>
        <div className="feature-card">
          <h3>Privacy</h3>
          <p>Unlike closed-source models, open-source AI can be run without sending your data to large corporations.</p>
        </div>
        <div className="feature-card">
          <h3>Community</h3>
          <p>Open-source AI is built and improved by a global community of researchers and developers.</p>
        </div>

        <h2>Supported Languages</h2>
        <p>StudyZone AI supports both English and Bangla (বাংলা), with automatic translation to help students learn in their native language.</p>

        <h2>Contact Us</h2>
        <p>Have questions or feedback? Reach us at hello@studyzone.ai</p>
      </div>
    ),
    bn: (
      <div className="subpage">
        <h1>StudyZone AI সম্পর্কে</h1>
        <p className="subpage-header">ওপেন-সোর্স AI এর মাধ্যমে শিক্ষার গণতন্ত্রীকরণ</p>
        <p>StudyZone AI একটি সহজ লক্ষ্য নিয়ে তৈরি করা হয়েছে: সবার কাছে উচ্চমানের AI-চালিত শিক্ষা সুলভ করা।</p>
        <h2>আমাদের লক্ষ্য</h2>
        <p>আমরা বিশ্বাস করি যে প্রতিটি শিক্ষার্থী, তাদের অবস্থান বা আর্থিক পটভূমি নির্বিশেষে, ২৪/৭ উপলব্ধ একজন জ্ঞানী শিক্ষকের অ্যাক্সেস পাওয়ার যোগ্য।</p>
        <h2>যোগাযোগ করুন</h2>
        <p>hello@studyzone.ai</p>
      </div>
    ),
  },
  settings: {
    en: (
      <div className="subpage">
        <h1>Settings</h1>
        <p className="subpage-header">Customize your StudyZone AI experience</p>

        <h2>Account</h2>
        <div className="feature-card">
          <h3>Profile</h3>
          <p>Manage your profile information through the user menu in the top bar. Click your profile picture to access account settings.</p>
        </div>
        <div className="feature-card">
          <h3>Sign Out</h3>
          <p>Use the user menu in the top bar to sign out of your account.</p>
        </div>

        <h2>Preferences</h2>
        <div className="feature-card">
          <h3>Default Language</h3>
          <p>Use the EN / বাং toggle at the top of the page to switch between English and Bangla responses at any time.</p>
        </div>
        <div className="feature-card">
          <h3>AI Model</h3>
          <p>Choose your preferred AI model (Llama 3, Mistral AI, or Gemma) using the model selector at the top of the chat page.</p>
        </div>

        <h2>Data & Privacy</h2>
        <div className="feature-card">
          <h3>Chat History</h3>
          <p>Your chat history is stored locally in your browser. Use the "Clear All History" button in the sidebar to delete all saved conversations.</p>
        </div>
        <div className="feature-card">
          <h3>Delete Account</h3>
          <p>To permanently delete your account and all associated data, contact us at support@studyzone.ai</p>
        </div>
      </div>
    ),
    bn: (
      <div className="subpage">
        <h1>সেটিংস</h1>
        <p className="subpage-header">আপনার StudyZone AI অভিজ্ঞতা কাস্টমাইজ করুন</p>
        <h2>অ্যাকাউন্ট</h2>
        <div className="feature-card">
          <h3>প্রোফাইল</h3>
          <p>শীর্ষ বারের ব্যবহারকারী মেনুর মাধ্যমে আপনার প্রোফাইল তথ্য পরিচালনা করুন।</p>
        </div>
        <h2>তথ্য ও গোপনীয়তা</h2>
        <div className="feature-card">
          <h3>চ্যাট ইতিহাস</h3>
          <p>আপনার চ্যাট ইতিহাস ব্রাউজারে স্থানীয়ভাবে সংরক্ষিত হয়। সাইডবারের "সব ইতিহাস মুছুন" বোতাম ব্যবহার করুন।</p>
        </div>
      </div>
    ),
  },
};

export default function SubPage({ page, lang }: SubPageProps) {
  const pageContent = content[page] ?? content.home;
  return <>{pageContent[lang]}</>;
}
