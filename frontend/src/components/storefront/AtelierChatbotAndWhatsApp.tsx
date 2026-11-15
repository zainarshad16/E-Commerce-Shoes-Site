'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ExternalLink,
  MessageCircle,
  Send,
  Sparkles,
  X,
  Phone,
  Mail,
} from 'lucide-react';
import { useStore } from '@/context/StoreContext';
import { openProductWithDoor } from '@/components/storefront/AtelierDoorTransition';
import { Product } from '@/types/cms';

type ChatLang = 'en' | 'ur-roman' | 'ur-native';

interface ChatMessage {
  id: string;
  sender: 'bot' | 'user';
  lang: ChatLang;
  text: string;
  suggestedProducts?: Product[];
  includeWhatsApp?: boolean;
  timestamp: string;
}

const ROMAN_URDU_WORDS = new Set([
  'salam',
  'assalam',
  'assalamualaikum',
  'aoa',
  'walaikum',
  'kaise',
  'kesay',
  'kese',
  'kya',
  'kia',
  'hai',
  'hain',
  'ho',
  'hun',
  'hoon',
  'joota',
  'jootay',
  'jootey',
  'jooti',
  'jutay',
  'qeemat',
  'keemat',
  'kimat',
  'kitne',
  'kitnay',
  'kitni',
  'ka',
  'ki',
  'ke',
  'ko',
  'se',
  'mein',
  'main',
  'chahiye',
  'chahte',
  'chahta',
  'batao',
  'bataen',
  'batayein',
  'batain',
  'milega',
  'milegi',
  'milenge',
  'mil',
  'sakta',
  'sakti',
  'mujhe',
  'mjhe',
  'mera',
  'meri',
  'mere',
  'apka',
  'aapka',
  'apki',
  'aap',
  'nahi',
  'nhi',
  'han',
  'haan',
  'ji',
  'shukriya',
  'meherbani',
  'karna',
  'karo',
  'kardo',
  'mangwana',
  'bhejo',
  'lahore',
  'karachi',
  'islamabad',
  'rawalpindi',
  'paisay',
  'paise',
  'sasta',
  'mehnga',
  'accha',
  'acha',
  'theek',
  'thik',
  'bohat',
  'boht',
  'bahut',
  'konsa',
  'kaunsa',
  'kidhar',
  'kahan',
  'waqt',
  'din',
  'wapas',
  'rabta',
  'bhi',
  'aur',
  'lekin',
  'apni',
  'yahan',
]);

function detectMessageLanguage(input: string, fallback: ChatLang): ChatLang {
  const trimmed = input.trim();
  if (!trimmed) return fallback;

  // 1. Native Urdu / Arabic Unicode block
  if (/[\u0600-\u06FF]/.test(trimmed)) {
    return 'ur-native';
  }

  // 2. Roman Urdu word tokens (English-typed Urdu)
  const tokens = trimmed
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);

  let romanMatches = 0;
  for (const t of tokens) {
    if (ROMAN_URDU_WORDS.has(t)) {
      romanMatches += 1;
    }
  }

  if (romanMatches >= 1) {
    return 'ur-roman';
  }

  // 3. Explicit English text when user clearly writes multi-word English
  if (tokens.length >= 1) {
    return 'en';
  }

  return fallback;
}

function formatWhatsAppUrl(phone: string, message: string): string {
  const digits = phone.replace(/[^\d]/g, '') || '923001234567';
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

function buildBotReply({
  userText,
  lang,
  products,
  contactPhone,
  adminEmail,
  storeAddress,
}: {
  userText: string;
  lang: ChatLang;
  products: Product[];
  contactPhone: string;
  adminEmail: string;
  storeAddress: string;
}): {
  text: string;
  suggestedProducts: Product[];
  includeWhatsApp: boolean;
} {
  const q = userText.toLowerCase();
  const published = products.filter((p) => p.published);

  // Match any mentioned product keywords
  const matchedProducts = published.filter((p) => {
    const hay = `${p.name} ${p.slug} ${p.category} ${p.tagline}`.toLowerCase();
    return (
      hay.split(/\s+/).some((w) => w.length > 3 && q.includes(w)) ||
      (q.includes('run') && hay.includes('runner')) ||
      (q.includes('dress') && hay.includes('oxford')) ||
      (q.includes('formal') && hay.includes('oxford')) ||
      (q.includes('red') && hay.includes('crimson')) ||
      (q.includes('brown') &&
        (hay.includes('mocha') || hay.includes('chestnut'))) ||
      (q.includes('blue') &&
        (hay.includes('navy') || hay.includes('cobalt'))) ||
      (q.includes('white') && hay.includes('ivory')) ||
      (q.includes('black') && hay.includes('onyx'))
    );
  });

  const isGreeting =
    /(hello|hi|hey|good morning|good evening|salam|assalam|aoa|سلام)/i.test(q) &&
    q.length < 36 &&
    matchedProducts.length === 0;

  const isPriceOrList =
    /(price|cost|rate|catalog|all shoes|show|collection|qeemat|keemat|kimat|kitne|kitnay|konsa|kaunsa|قیمت|کتنے|جوتے|کونسا)/i.test(
      q
    );

  const isSize = /(size|fit|measurement|eu|uk|us|ناپ|سائز)/i.test(q);
  const isShipping =
    /(deliver|shipping|ship|return|exchange|order|track|pay|stripe|cod|lahore|karachi|islamabad|bhejo|wapas|ڈلیوری|آرڈر|واپسی|ادائیگی)/i.test(
      q
    );
  const isContact =
    /(phone|number|whatsapp|email|contact|support|admin|address|location|rabta|call|رابطہ|نمبر|واٹس ایپ|ای میل)/i.test(
      q
    );

  if (isGreeting) {
    if (lang === 'ur-native') {
      return {
        text: `وعلیکم السلام! Atelier Vance اسٹوڈیو میں خوش آمدید۔ میں آپ کو جوتوں کی قیمت، سائز، آرڈر، ڈلیوری یا 3D شو روم دیکھنے میں مدد دے سکتا ہوں۔ بتائیے آج آپ کو کس طرح کے جوتے چاہئیں؟`,
        suggestedProducts: published.slice(0, 2),
        includeWhatsApp: false,
      };
    }
    if (lang === 'ur-roman') {
      return {
        text: `Walaikum Assalam! Atelier Vance mein khush amdeed. Main aapko shoes ki qeemat, sizes (US/UK/EU), delivery, ya 3D view dekhne mein madad kar sakta hoon. Batayein aapko kaun sa joota pasand hai?`,
        suggestedProducts: published.slice(0, 2),
        includeWhatsApp: false,
      };
    }
    return {
      text: `Hello and welcome to Atelier Vance! I can help you explore our ${published.length} handcrafted footwear styles, check prices & sizing, track delivery, or connect you straight to WhatsApp. Which style are you looking for today?`,
      suggestedProducts: published.slice(0, 2),
      includeWhatsApp: false,
    };
  }

  if (matchedProducts.length > 0) {
    const picks = matchedProducts.slice(0, 3);
    const summaryLines = picks
      .map((p) => `• ${p.name} — $${p.basePrice} (${p.category})`)
      .join('\n');

    if (lang === 'ur-native') {
      return {
        text: `جی ہاں! یہ جوتے ہمارے کلیکشن میں موجود ہیں:\n${summaryLines}\n\nآپ نیچے دیے گئے کارڈ پر کلک کر کے 3D شو روم میں چاروں طرف سے دیکھ سکتے ہیں اور اپنا سائز آرڈر کر سکتے ہیں۔`,
        suggestedProducts: picks,
        includeWhatsApp: true,
      };
    }
    if (lang === 'ur-roman') {
      return {
        text: `Ji bilkul! Yeh shoes hamaray paas dastiyab hain:\n${summaryLines}\n\nNeeche diye gaye button par click kar ke aap inka 3D view dekh saktay hain aur apna size order kar saktay hain.`,
        suggestedProducts: picks,
        includeWhatsApp: true,
      };
    }
    return {
      text: `Here is what matches in our studio collection:\n${summaryLines}\n\nClick any pair below to enter the 3D Showroom, rotate all angles, and pick your size.`,
      suggestedProducts: picks,
      includeWhatsApp: true,
    };
  }

  if (isSize) {
    if (lang === 'ur-native') {
      return {
        text: `ہمارے پاس US 7 سے US 13 (EU 40 تا EU 47 / UK 6 تا UK 12) تک تمام سائز دستیاب ہیں۔ اگر سائز چھوٹا یا بڑا ہو تو 30 دن کے اندر مفت سائز تبدیلی کی سہولت موجود ہے۔`,
        suggestedProducts: [],
        includeWhatsApp: false,
      };
    }
    if (lang === 'ur-roman') {
      return {
        text: `Hamaray paas US 7 se US 13 (EU 40 se 47 aur UK 6 se 12) tak sizes available hain. Agar size fit na aaye toh 30 din mein free size exchange milta hai.`,
        suggestedProducts: [],
        includeWhatsApp: false,
      };
    }
    return {
      text: `We offer true-to-size fits across US 7–13 (EU 40–47 / UK 6–12) on every silhouette, backed by a 30-day wear trial and complimentary size exchanges.`,
      suggestedProducts: [],
      includeWhatsApp: false,
    };
  }

  if (isShipping) {
    if (lang === 'ur-native') {
      return {
        text: `ہم پورے پاکستان (لاہور، کراچی، اسلام آباد اور تمام شہروں) اور دنیا بھر میں تیز ڈلیوری فراہم کرتے ہیں۔ $150 سے زائد آرڈر پر شپنگ بالکل مفت ہے۔ ادائیگی Stripe کارڈ یا چیک آؤٹ پر دستیاب محفوظ طریقوں سے ہو سکتی ہے۔`,
        suggestedProducts: [],
        includeWhatsApp: true,
      };
    }
    if (lang === 'ur-roman') {
      return {
        text: `Hum poore Pakistan (Lahore, Karachi, Islamabad waghaira) aur international locations par fast delivery karte hain. $150 se oopar free shipping hai aur aap Stripe card ya checkout par mojood payment methods se easily pay kar saktay hain.`,
        suggestedProducts: [],
        includeWhatsApp: true,
      };
    }
    return {
      text: `We ship express nationwide (including Lahore, Karachi, Islamabad & global destinations) with free shipping over $150, 30-day returns, and Stripe/card payment options at /checkout.`,
      suggestedProducts: [],
      includeWhatsApp: true,
    };
  }

  if (isContact) {
    if (lang === 'ur-native') {
      return {
        text: `آپ ہم سے براہِ راست رابطہ کر سکتے ہیں:\n• فون / واٹس ایپ: ${contactPhone}\n• ای میل: ${adminEmail}\n• اسٹوڈیو: ${storeAddress}\n\nفوری بات چیت کے لیے نیچے WhatsApp بٹن دبائیں۔`,
        suggestedProducts: [],
        includeWhatsApp: true,
      };
    }
    if (lang === 'ur-roman') {
      return {
        text: `Aap hamaray admin aur support team se seedha rabta kar saktay hain:\n• Phone / WhatsApp: ${contactPhone}\n• Email: ${adminEmail}\n• Studio: ${storeAddress}\n\nFori chat ke liye neeche WhatsApp button par click karein.`,
        suggestedProducts: [],
        includeWhatsApp: true,
      };
    }
    return {
      text: `You can reach our Atelier Vance team directly:\n• Phone / WhatsApp: ${contactPhone}\n• Admin Email: ${adminEmail}\n• Studio: ${storeAddress}`,
      suggestedProducts: [],
      includeWhatsApp: true,
    };
  }

  if (isPriceOrList) {
    const picks = published.slice(0, 4);
    const lines = picks.map((p) => `• ${p.name} — $${p.basePrice}`).join('\n');
    if (lang === 'ur-native') {
      return {
        text: `ہمارے مشہور جوتے اور ان کی قیمتیں:\n${lines}\n\nکسی بھی جوتے پر کلک کر کے اس کا 3D ویو دیکھیں۔`,
        suggestedProducts: picks,
        includeWhatsApp: false,
      };
    }
    if (lang === 'ur-roman') {
      return {
        text: `Hamaray popular shoes aur unki qeematein yeh hain:\n${lines}\n\nKisi bhi shoe par click kar ke 3D view dekhein aur order karein.`,
        suggestedProducts: picks,
        includeWhatsApp: false,
      };
    }
    return {
      text: `Our current handcrafted lineup ranges from $98 to $215:\n${lines}\n\nClick any pair below to inspect it in the 3D Showroom.`,
      suggestedProducts: picks,
      includeWhatsApp: false,
    };
  }

  // General intelligent fallback in adapted language
  if (lang === 'ur-native') {
    return {
      text: `آپ کا پیغام موصول ہو گیا ہے! آپ جوتوں کے نام، قیمت، سائز (US/EU)، ڈلیوری یا ہمارے واٹس ایپ نمبر (${contactPhone}) کے بارے میں پوچھ سکتے ہیں—یا نیچے موجود جوتوں میں سے کوئی منتخب کریں۔`,
      suggestedProducts: published.slice(0, 2),
      includeWhatsApp: true,
    };
  }
  if (lang === 'ur-roman') {
    return {
      text: `Ji zaroor! Aap mujh se shoes ki qeemat, size (US/EU/UK), delivery time ya WhatsApp rabta (${contactPhone}) ke baray mein pooch saktay hain—ya neeche diye gaye pairs dekh lein.`,
      suggestedProducts: published.slice(0, 2),
      includeWhatsApp: true,
    };
  }
  return {
    text: `I'd be happy to help with that! Ask me about shoe styles, prices, US/EU/UK sizing, shipping & Stripe checkout, or reach our concierge directly on WhatsApp (${contactPhone}).`,
    suggestedProducts: published.slice(0, 2),
    includeWhatsApp: true,
  };
}

export function AtelierChatbotAndWhatsApp() {
  const { products, contactSettings } = useStore();

  const [isOpen, setIsOpen] = useState(false);
  const [activeLang, setActiveLang] = useState<ChatLang>('en');
  const [hasUserSpoken, setHasUserSpoken] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: 'welcome-en',
      sender: 'bot',
      lang: 'en',
      text: `Hello! I'm your Atelier Vance Footwear Assistant. Ask me anything in English, Roman Urdu, or اردو — I automatically adapt to how you write!`,
      timestamp: 'Now',
    },
  ]);

  const scrollBottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      scrollBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const whatsappHref = useMemo(
    () =>
      formatWhatsAppUrl(
        contactSettings.whatsappNumber,
        contactSettings.whatsappGreeting
      ),
    [contactSettings.whatsappNumber, contactSettings.whatsappGreeting]
  );

  if (!contactSettings.chatbotEnabled) {
    return (
      <a
        href={whatsappHref}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat on WhatsApp"
        className="fixed right-5 bottom-5 z-[85] inline-flex h-13 items-center gap-2 rounded-full bg-[#25D366] px-4 text-xs font-bold text-white shadow-[0_14px_35px_rgba(37,211,102,0.4)] transition hover:scale-105"
      >
        <Phone className="h-4 w-4" />
        <span>WhatsApp</span>
      </a>
    );
  }

  const handleSend = (textOverride?: string) => {
    const text = (textOverride ?? inputValue).trim();
    if (!text) return;

    const detectedLang = detectMessageLanguage(text, activeLang);
    // Behavior adapts dynamically to user's first message & language style
    const resolvedLang = !hasUserSpoken
      ? detectedLang
      : detectedLang !== 'en'
      ? detectedLang
      : activeLang === 'ur-native' || activeLang === 'ur-roman'
      ? detectedLang
      : activeLang;

    setActiveLang(resolvedLang);
    setHasUserSpoken(true);

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      sender: 'user',
      lang: resolvedLang,
      text,
      timestamp: new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      }),
    };

    const reply = buildBotReply({
      userText: text,
      lang: resolvedLang,
      products,
      contactPhone: contactSettings.supportPhone,
      adminEmail: contactSettings.adminEmail,
      storeAddress: contactSettings.storeAddress,
    });

    const botMsg: ChatMessage = {
      id: `b-${Date.now() + 1}`,
      sender: 'bot',
      lang: resolvedLang,
      text: reply.text,
      suggestedProducts: reply.suggestedProducts,
      includeWhatsApp: reply.includeWhatsApp,
      timestamp: new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      }),
    };

    setMessages((prev) => [...prev, userMsg, botMsg]);
    if (!textOverride) {
      setInputValue('');
    }
  };

  const handleManualLanguagePick = (lang: ChatLang) => {
    setActiveLang(lang);
    setHasUserSpoken(true);
    const switchNote =
      lang === 'ur-native'
        ? 'زبان اردو (Urdu Script) پر منتقل کر دی گئی ہے۔ بتائیے آج ہم آپ کی کیا مدد کر سکتے ہیں؟'
        : lang === 'ur-roman'
        ? 'Language Roman Urdu par set ho gayi hai. Poochhein shoes, sizes ya price ke baray mein!'
        : 'Switched to English. Ask me about shoe styles, prices, sizing, or delivery!';

    setMessages((prev) => [
      ...prev,
      {
        id: `lang-${Date.now()}`,
        sender: 'bot',
        lang,
        text: switchNote,
        timestamp: new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        }),
      },
    ]);
  };

  const quickPrompts: { label: string; text: string }[] =
    activeLang === 'ur-native'
      ? [
          { label: 'جوتوں کی قیمت؟', text: 'جوتوں کی قیمت بتائیں' },
          { label: 'سائز اور ڈلیوری', text: 'سائز اور ڈلیوری کی تفصیل' },
          { label: 'واٹس ایپ رابطہ', text: 'رابطہ نمبر اور ای میل دیں' },
        ]
      : activeLang === 'ur-roman'
      ? [
          { label: 'Shoes ki qeemat?', text: 'Shoes ki qeemat batao' },
          { label: 'Size & Delivery?', text: 'Size aur delivery kaise hogi?' },
          { label: 'WhatsApp / Contact', text: 'Admin number aur WhatsApp dein' },
        ]
      : [
          { label: 'Show shoe prices', text: 'Show shoe collection and prices' },
          { label: 'اسٹور کی تفصیل (اردو)', text: 'مجھے جوتوں کی قیمت اور سائز بتائیں' },
          { label: 'Roman Urdu', text: 'Assalam o Alaikum, shoes ki qeemat kya hai?' },
        ];

  return (
    <div className="fixed right-5 bottom-5 z-[85] flex flex-col items-end gap-3">
      {/* Expanded Chat Panel */}
      {isOpen && (
        <div
          role="dialog"
          aria-label={contactSettings.chatbotName}
          className="flex h-[510px] w-[calc(100vw-2.5rem)] max-w-[390px] flex-col overflow-hidden rounded-3xl border border-stone-900/15 bg-[#FAF8F4] shadow-[0_28px_80px_rgba(24,24,27,0.28)]"
        >
          {/* Chatbot Header + Language Pills + Direct WhatsApp */}
          <div className="bg-[#18181B] px-4 py-3.5 text-[#F6F3EC]">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="relative flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[#F5E2A8] to-[#8C4A27] text-stone-950">
                  <Sparkles className="h-4 w-4" />
                  <span className="absolute -right-0.5 -bottom-0.5 h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-[#18181B]" />
                </div>
                <div>
                  <p className="text-xs font-bold tracking-wide text-white">
                    {contactSettings.chatbotName}
                  </p>
                  <p className="text-[10px] text-zinc-400">
                    English · Roman Urdu · اردو (Auto-Adaptive)
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <a
                  href={whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Chat on WhatsApp"
                  className="inline-flex h-8 items-center gap-1 rounded-full bg-[#25D366] px-2.5 text-[10px] font-bold text-white transition hover:brightness-110"
                >
                  <Phone className="h-3 w-3" />
                  <span>WA</span>
                </a>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="rounded-full p-1.5 text-zinc-400 transition hover:bg-white/10 hover:text-white"
                  aria-label="Close chat"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Active Language Selector Bar */}
            <div className="mt-2.5 flex items-center gap-1.5">
              {(
                [
                  { id: 'en', label: 'English (Default)' },
                  { id: 'ur-roman', label: 'Roman Urdu' },
                  { id: 'ur-native', label: 'اردو' },
                ] as const
              ).map((pill) => (
                <button
                  key={pill.id}
                  type="button"
                  onClick={() => handleManualLanguagePick(pill.id)}
                  className={`rounded-full px-2.5 py-0.5 text-[10px] font-medium transition ${
                    activeLang === pill.id
                      ? 'bg-[#F5E2A8] text-stone-950 font-semibold'
                      : 'border border-white/15 bg-white/5 text-zinc-300 hover:bg-white/15'
                  }`}
                >
                  {pill.label}
                </button>
              ))}
            </div>
          </div>

          {/* Messages Stream */}
          <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
            {messages.map((msg) => {
              const isRtl = msg.lang === 'ur-native';
              const isUser = msg.sender === 'user';
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${
                    isUser ? 'items-end' : 'items-start'
                  }`}
                >
                  <div
                    dir={isRtl ? 'rtl' : 'ltr'}
                    className={`max-w-[88%] whitespace-pre-line rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed shadow-sm ${
                      isUser
                        ? 'rounded-br-sm bg-[#18181B] text-[#FAF8F4]'
                        : 'rounded-bl-sm border border-stone-900/10 bg-white text-stone-800'
                    }`}
                  >
                    {msg.text}

                    {msg.suggestedProducts && msg.suggestedProducts.length > 0 && (
                      <div className="mt-2.5 space-y-1.5 border-t border-stone-900/10 pt-2">
                        {msg.suggestedProducts.map((prod) => (
                          <button
                            key={prod.id}
                            type="button"
                            onClick={() => {
                              setIsOpen(false);
                              openProductWithDoor(
                                `/product/${prod.slug}`,
                                prod.name
                              );
                            }}
                            className="flex w-full items-center justify-between gap-2 rounded-xl border border-stone-900/10 bg-[#F6F3EC] px-2.5 py-1.5 text-left transition hover:border-[#8C4A27]/50"
                          >
                            <div className="flex min-w-0 items-center gap-2">
                              <img
                                src={
                                  prod.variants[0]?.posterImageUrl ||
                                  prod.ogImageUrl
                                }
                                alt={prod.name}
                                className="h-7 w-7 rounded object-contain bg-white"
                              />
                              <div className="min-w-0">
                                <p className="truncate text-[11px] font-semibold text-stone-900">
                                  {prod.name}
                                </p>
                                <p className="text-[10px] text-stone-500">
                                  ${prod.basePrice} · View 3D
                                </p>
                              </div>
                            </div>
                            <ExternalLink className="h-3 w-3 shrink-0 text-[#8C4A27]" />
                          </button>
                        ))}
                      </div>
                    )}

                    {msg.includeWhatsApp && (
                      <div className="mt-2.5 flex flex-wrap gap-1.5 pt-1">
                        <a
                          href={whatsappHref}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-full bg-[#25D366] px-3 py-1 text-[10px] font-bold text-white transition hover:brightness-105"
                        >
                          <Phone className="h-3 w-3" />
                          <span>
                            {msg.lang === 'ur-native'
                              ? 'واٹس ایپ پر بات کریں'
                              : msg.lang === 'ur-roman'
                              ? 'WhatsApp Par Rabta Karein'
                              : 'Continue on WhatsApp'}
                          </span>
                        </a>
                        <a
                          href={`mailto:${contactSettings.adminEmail}`}
                          className="inline-flex items-center gap-1 rounded-full border border-stone-900/15 bg-[#F6F3EC] px-2.5 py-1 text-[10px] font-medium text-stone-700 hover:border-stone-900/35"
                        >
                          <Mail className="h-3 w-3" />
                          <span>{contactSettings.adminEmail}</span>
                        </a>
                      </div>
                    )}
                  </div>
                  <span className="mt-1 px-1 text-[9px] text-stone-400">
                    {msg.timestamp}
                  </span>
                </div>
              );
            })}
            <div ref={scrollBottomRef} />
          </div>

          {/* Quick Suggested Prompts */}
          <div className="flex flex-wrap gap-1.5 border-t border-stone-900/10 bg-[#F3EFE6] px-3 py-2">
            {quickPrompts.map((qp) => (
              <button
                key={qp.label}
                type="button"
                onClick={() => handleSend(qp.text)}
                className="rounded-full border border-stone-900/10 bg-white px-2.5 py-1 text-[10px] font-medium text-stone-700 transition hover:border-[#8C4A27]/40 hover:text-[#8C4A27]"
              >
                {qp.label}
              </button>
            ))}
          </div>

          {/* Composer */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2 border-t border-stone-900/10 bg-white px-3 py-2.5"
          >
            <input
              type="text"
              dir={/[\u0600-\u06FF]/.test(inputValue) ? 'rtl' : 'ltr'}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={
                activeLang === 'ur-native'
                  ? 'یہاں اردو یا انگریزی میں لکھیں...'
                  : activeLang === 'ur-roman'
                  ? 'Roman Urdu ya English mein likhein...'
                  : 'Ask in English, Roman Urdu, or اردو...'
              }
              className="h-9 flex-1 rounded-full border border-stone-900/15 bg-[#F6F3EC] px-3.5 text-xs text-stone-900 placeholder:text-stone-400 focus:border-[#8C4A27] focus:bg-white focus:outline-none"
            />
            <button
              type="submit"
              disabled={!inputValue.trim()}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#18181B] text-white transition hover:bg-[#8C4A27] disabled:opacity-40"
              aria-label="Send message"
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          </form>
        </div>
      )}

      {/* Floating Launcher Dock: Direct WhatsApp + Adaptive Chatbot */}
      <div className="flex items-center gap-2.5">
        <a
          href={whatsappHref}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="WhatsApp Support"
          className="inline-flex h-12 items-center gap-2 rounded-full bg-[#25D366] px-4 text-xs font-bold text-white shadow-[0_12px_30px_rgba(37,211,102,0.38)] transition hover:-translate-y-0.5 hover:brightness-105"
        >
          <Phone className="h-4 w-4" />
          <span className="hidden sm:inline">WhatsApp</span>
        </a>

        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          aria-label="Toggle Atelier AI Assistant"
          className="inline-flex h-12 items-center gap-2 rounded-full border border-[#D4AF37]/45 bg-[#18181B] px-4 text-xs font-semibold text-[#F6F3EC] shadow-[0_14px_34px_rgba(24,24,27,0.34)] transition hover:-translate-y-0.5 hover:bg-[#27272A]"
        >
          <MessageCircle className="h-4 w-4 text-[#F5E2A8]" />
          <span>{isOpen ? 'Close Chat' : 'Concierge Chat'}</span>
        </button>
      </div>
    </div>
  );
}
