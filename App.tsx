import React, { useEffect, useRef, useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  useWindowDimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
  LayoutChangeEvent,
  Alert,
  Animated,
  Easing,
  Linking,
  Platform,
} from "react-native";
import { Video, AVPlaybackSource, ResizeMode } from "expo-av";

const CRAFTTECH_LOGO = require("./assets/crafttech-logo.png");
/* Helper for native driver (safe on web) */
const useDriver = Platform.OS !== "web";

/* -----------------------------------------------------
   TYPES
----------------------------------------------------- */
type SectionKey =
  | "hero"
  | "services"
  | "process"
  | "work"
  | "testimonials"
  | "contact";

type PortfolioCategory = "all" | "web" | "mobile" | "ecommerce";

interface PortfolioItem {
  id: number;
  title: string;
  type: string;
  category: PortfolioCategory;
  description: string;
  metrics: string[];
  img: string;
}

interface HeroSlide {
  id: string;
  title: string;
  subtitle: string;
  source: AVPlaybackSource;
}

/* -----------------------------------------------------
   PREMIUM COLOR SCHEME
----------------------------------------------------- */
const COLORS = {
  bg: "#0A0F0D",         // Deep charcoal
  bgSoft: "#111715",     // Lifted dark
  card: "#1A211E",       // Rich dark
  cardSoft: "#222A26",   // Elevated card
  border: "#2D3632",
  neon: "#B6FF33",       // Lime green (matches reference)
  neonSoft: "#A2E52E",   // Softer lime
  accent: "#6366F1",     // Indigo accent
  text: "#F8FAF6",       // Clean white
  textMuted: "#94A39A",  // Muted sage
  subtle: "#6B7A70",     // Medium muted
};
const BUTTON_COLOR = COLORS.neon; // Shared lime for all CTAs

/* -----------------------------------------------------
   PREMIUM HERO SLIDES
----------------------------------------------------- */
const HERO_SLIDES: HeroSlide[] = [
  {
    id: "crafting-premium",
    title: "We craft software that feels premium\nand performs under pressure.",
    subtitle: "From concept to launch, CraftTech partners with US businesses to design and build modern digital products.",
    source: require("./assets/Herovideo1.mp4"),
  },
  {
    id: "future-architecture",
    title: "Type-safe, AI-ready architectures\nbuilt for the next decade.",
    subtitle: "We use modern TypeScript, cloud, and data practices to future-proof your platforms.",
    source: require("./assets/Hero2.mp4"),
  },
  {
    id: "product-squad",
    title: "Your product squad — strategy, design,\nand engineering in one team.",
    subtitle: "A distributed studio from Pakistan building for North American founders, product leaders, and CTOs.",
    source: require("./assets/Hero3.mp4"),
  },
];

/* -----------------------------------------------------
   PREMIUM PORTFOLIO ITEMS
----------------------------------------------------- */
const PORTFOLIO_ITEMS: PortfolioItem[] = [
  {
    id: 1,
    title: "Fintech SaaS Dashboard",
    type: "Web App",
    category: "web",
    description: "Analytics-heavy admin experience with secure multi-tenant access and real-time KPIs.",
    metrics: ["+38% retention", "SOC2-ready", "Enterprise grade"],
    img: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800",
  },
  {
    id: 2,
    title: "Telehealth Mobile Platform",
    type: "Mobile App",
    category: "mobile",
    description: "Virtual care, scheduling, and secure messaging for a US-based healthcare startup.",
    metrics: ["iOS & Android", "50k+ sessions", "HIPAA compliant"],
    img: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1000&q=80",
  },
  {
    id: 3,
    title: "Headless Commerce Experience",
    type: "E-Commerce",
    category: "ecommerce",
    description: "Conversion-optimized storefront with a custom product configurator and fast checkout.",
    metrics: ["3.9x ROI", "<1s page loads", "PWA ready"],
    img: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800",
  },
];

/* -----------------------------------------------------
   PREMIUM TESTIMONIALS
----------------------------------------------------- */
const TESTIMONIALS = [
  {
    id: 1,
    quote: "CraftTech helped us ship a product our customers actually love to use. Their attention to detail in both design and engineering is exceptional.",
    name: "Jordan Miles",
    role: "VP Product, Fintech Startup",
    company: "ScaleFin",
  },
  {
    id: 2,
    quote: "They understand both UX and engineering at a deep level. The collaboration felt like having an internal product squad that just gets it.",
    name: "Emily Carter",
    role: "Founder & CEO",
    company: "HealthTech Solutions",
  },
  {
    id: 3,
    quote: "Clear communication, exceptional quality, and they handled complex requirements without drama. Would partner with them again in a heartbeat.",
    name: "Daniel Ortiz",
    role: "CTO",
    company: "Modern Retail Co",
  },
];

// Enhanced responsive font scaler
export const scaleFont = (size: number, width: number) => {
  const baseWidth = 375;
  const scaleFactor = width / baseWidth;
  
  if (width < 380) return Math.max(size * 0.82, 10);
  if (width < 480) return size * 0.92;
  if (width < 768) return size * 1.0;
  if (width < 1024) return size * 1.12;
  if (width < 1280) return size * 1.2;
  return size * 1.3;
};

/* -----------------------------------------------------
   GRADIENT VIEW COMPONENT (Fallback without expo-linear-gradient)
----------------------------------------------------- */
const GradientView: React.FC<{
  colors: string[];
  style?: any;
  children?: React.ReactNode;
}> = ({ colors, style, children }) => {
  if (Platform.OS === 'web') {
    // Web version using CSS gradient
    return (
      <View 
        style={[
          style,
          {
            background: `linear-gradient(135deg, ${colors.join(', ')})`,
          }
        ]}
      >
        {children}
      </View>
    );
  }
  
  // Native version - fallback to solid color (first color in array)
  return (
    <View 
      style={[
        style,
        { backgroundColor: colors[0] }
      ]}
    >
      {children}
    </View>
  );
};

// Animated ScrollView wrapper for consistent onScroll behavior
const AnimatedScrollView = Animated.createAnimatedComponent(ScrollView);

/* -----------------------------------------------------
   PREMIUM APP COMPONENT
----------------------------------------------------- */
const App: React.FC = () => {
  const scrollRef = useRef<ScrollView | null>(null);
  const videoRef = useRef<Video | null>(null);
  const { width, height } = useWindowDimensions();
  const s = (size: number) => scaleFont(size, width);

  const isMobile = width <= 768;
  const isTablet = width > 768 && width < 1024;
  const isDesktop = width >= 1024;
  const isWeb = Platform.OS === "web";

  // Enhanced responsive values
  const sectionPadding = isDesktop ? 96 : isTablet ? 64 : 48;
  const navPadding = isDesktop ? 40 : isTablet ? 24 : 16;

  // Hero sizing: keep video fully visible, responsive by device
  // Hero sizing – always show full video frame (no cropping)
const heroAspectRatio = 16 / 9;              // same for all slides
const heroHeight = isMobile
  ? Math.min(height * 0.75, 520) // nice big hero on phones
  : width / heroAspectRatio;  // height = width / aspect
  // Container style for all main sections
  const containerStyle = {
    maxWidth: 1280,
    width: "100%" as any,
    alignSelf: "center" as const,
  };

  // STATE
  const [sectionPositions, setSectionPositions] = useState<Partial<Record<SectionKey, number>>>({});
  const [scrolled, setScrolled] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [portfolioFilter, setPortfolioFilter] = useState<PortfolioCategory>("all");
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const [videoReady, setVideoReady] = useState(false);
  const scrollY = useRef(new Animated.Value(0)).current;

  const [form, setForm] = useState({
    name: "",
    email: "",
    company: "",
    budget: "",
    message: "",
  });

  // PREMIUM ANIMATIONS
  const heroAnim = useRef(new Animated.Value(0)).current;
  const headerAnim = useRef(new Animated.Value(0)).current;

  // Services animations
  const [servicesAnimated, setServicesAnimated] = useState(false);
  const servicesTitleAnim = useRef(new Animated.Value(0)).current;
  const serviceCardsAnim = useRef(new Animated.Value(0)).current;

  // Process animations
  const [processAnimated, setProcessAnimated] = useState(false);
  const processStepsAnim = useRef(new Animated.Value(0)).current;

  // Work animations
  const [workAnimated, setWorkAnimated] = useState(false);
  const workItemsAnim = useRef(new Animated.Value(0)).current;

  // Testimonials animations
  const [testimonialsAnimated, setTestimonialsAnimated] = useState(false);
  const testimonialsAnim = useRef(new Animated.Value(0)).current;

  // Footer animation
  const footerAnim = useRef(new Animated.Value(0)).current;

  const currentSlide = HERO_SLIDES[activeSlideIndex];

  /* -----------------------------------------------------
     PREMIUM HERO AUTOPLAY & ANIMATIONS
  ----------------------------------------------------- */
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveSlideIndex((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    heroAnim.setValue(0);
    Animated.parallel([
      Animated.timing(heroAnim, {
        toValue: 1,
        duration: 1000,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: useDriver,
      }),
      Animated.timing(headerAnim, {
        toValue: 1,
        duration: 800,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: useDriver,
      }),
    ]).start();
  }, [activeSlideIndex, heroAnim, headerAnim]);

  // Web fallback: ensure sections animate in shortly after mount so content isn't hidden
  useEffect(() => {
    if (!isWeb) return;
    const timer = setTimeout(() => {
      if (!servicesAnimated) triggerServicesAnimation();
      if (!processAnimated) triggerProcessAnimation();
      if (!workAnimated) triggerWorkAnimation();
      if (!testimonialsAnimated) {
        triggerTestimonialsAnimation();
        Animated.timing(footerAnim, {
          toValue: 1,
          duration: 600,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: useDriver,
        }).start();
      }
    }, 180);
    return () => clearTimeout(timer);
  }, [
    isWeb,
    servicesAnimated,
    processAnimated,
    workAnimated,
    testimonialsAnimated,
    footerAnim,
    useDriver,
  ]);

  /* -----------------------------------------------------
     PREMIUM SCROLL TRIGGERED ANIMATIONS
  ----------------------------------------------------- */
  const triggerServicesAnimation = () => {
    if (servicesAnimated) return;
    setServicesAnimated(true);

    Animated.stagger(200, [
      Animated.timing(servicesTitleAnim, {
        toValue: 1,
        duration: 800,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: useDriver,
      }),
      Animated.timing(serviceCardsAnim, {
        toValue: 1,
        duration: 600,
        easing: Easing.out(Easing.back(1.2)),
        useNativeDriver: useDriver,
      }),
    ]).start();
  };

  const triggerProcessAnimation = () => {
    if (processAnimated) return;
    setProcessAnimated(true);

    Animated.timing(processStepsAnim, {
      toValue: 1,
      duration: 1000,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: useDriver,
    }).start();
  };

  const triggerWorkAnimation = () => {
    if (workAnimated) return;
    setWorkAnimated(true);

    Animated.timing(workItemsAnim, {
      toValue: 1,
      duration: 800,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: useDriver,
    }).start();
  };

  const triggerTestimonialsAnimation = () => {
    if (testimonialsAnimated) return;
    setTestimonialsAnimated(true);

    Animated.timing(testimonialsAnim, {
      toValue: 1,
      duration: 800,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: useDriver,
    }).start();
  };

  /* -----------------------------------------------------
     WEB ANIMATION FIXES
  ----------------------------------------------------- */
  /* -----------------------------------------------------
   WEB ANIMATION FIXES (timed entrance, no blank states)
----------------------------------------------------- */


  /* -----------------------------------------------------
     PREMIUM SCROLL HANDLER
  ----------------------------------------------------- */
  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const native: any = e.nativeEvent;

    // SAFELY get scrollY (works for native + web)
    const y =
      typeof native?.contentOffset?.y === "number"
        ? native.contentOffset.y
        : typeof (native as any)?.target?.scrollTop === "number"
        ? (native as any).target.scrollTop
        : typeof window !== "undefined" && typeof window.scrollY === "number"
        ? window.scrollY
        : 0;

    const screenBottom = y + height;

    setScrolled(y > 100);

    // SERVICES
    if (
      !servicesAnimated &&
      sectionPositions.services != null &&
      screenBottom >= sectionPositions.services + 60
    ) {
      triggerServicesAnimation();
    }

    // PROCESS
    if (
      !processAnimated &&
      sectionPositions.process != null &&
      screenBottom >= sectionPositions.process + 60
    ) {
      triggerProcessAnimation();
    }

    // WORK
    if (
      !workAnimated &&
      sectionPositions.work != null &&
      screenBottom >= sectionPositions.work + 60
    ) {
      triggerWorkAnimation();
    }

    // TESTIMONIALS + FOOTER
    if (
      !testimonialsAnimated &&
      sectionPositions.testimonials != null &&
      screenBottom >= sectionPositions.testimonials + 60
    ) {
      triggerTestimonialsAnimation();

      Animated.timing(footerAnim, {
        toValue: 1,
        duration: 600,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: useDriver,
      }).start();
    }
  };


  const handleSectionLayout = (key: SectionKey) => (event: LayoutChangeEvent) => {
    const { y } = event.nativeEvent.layout;
    setSectionPositions((prev) => ({ ...prev, [key]: y }));
  };

  // When sections report their positions, trigger any that are already visible
  useEffect(() => {
    const initialBottom = height; // user at top, no scroll yet

    if (
      !servicesAnimated &&
      sectionPositions.services != null &&
      initialBottom >= sectionPositions.services + 60
    ) {
      triggerServicesAnimation();
    }

    if (
      !processAnimated &&
      sectionPositions.process != null &&
      initialBottom >= sectionPositions.process + 60
    ) {
      triggerProcessAnimation();
    }

    if (
      !workAnimated &&
      sectionPositions.work != null &&
      initialBottom >= sectionPositions.work + 60
    ) {
      triggerWorkAnimation();
    }

    if (
      !testimonialsAnimated &&
      sectionPositions.testimonials != null &&
      initialBottom >= sectionPositions.testimonials + 60
    ) {
      triggerTestimonialsAnimation();

      Animated.timing(footerAnim, {
        toValue: 1,
        duration: 600,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: useDriver,
      }).start();
    }
  }, [
    sectionPositions,
    height,
    servicesAnimated,
    processAnimated,
    workAnimated,
    testimonialsAnimated,
  ]);

  // Re-run scroll handler when layout updates or viewport changes to ensure correct section triggers
  useEffect(() => {
    const currentY =
      typeof window !== "undefined" && typeof window.scrollY === "number"
        ? window.scrollY
        : 0;

    handleScroll({
      nativeEvent: {
        contentOffset: { y: currentY },
        target: { scrollTop: currentY },
      },
    } as any);
    // We intentionally skip handleScroll in deps to avoid re-running every render
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sectionPositions, height]);

  const scrollToSection = (key: SectionKey) => {
    const y = sectionPositions[key] ?? 0;
    scrollRef.current?.scrollTo({ y: y - 80, animated: true });
    setNavOpen(false);
    setOpenDropdown(null);
  };

  const handleFormChange = (field: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = () => {
    if (!form.email || !form.message) {
      Alert.alert("Missing info", "Please add at least your email and project details.");
      return;
    }
    Alert.alert("Brief sent", "We'll review your project and reply within one business day.");
    setForm({
      name: "",
      email: "",
      company: "",
      budget: "",
      message: "",
    });
  };

  const filteredPortfolio = portfolioFilter === "all"
    ? PORTFOLIO_ITEMS
    : PORTFOLIO_ITEMS.filter((i) => i.category === portfolioFilter);

  /* -----------------------------------------------------
     PREMIUM NAV ITEMS
  ----------------------------------------------------- */
  const centerNavItems = [
    {
      key: "services",
      label: "Services",
      section: "services" as SectionKey,
      children: [
        { label: "Web App Development", section: "services" as SectionKey },
        { label: "Mobile App Development", section: "services" as SectionKey },
        { label: "UI/UX & Product Design", section: "services" as SectionKey },
        { label: "Cloud & Backend Engineering", section: "services" as SectionKey },
      ],
    },
    {
      key: "work",
      label: "Work",
      section: "work" as SectionKey,
      children: [
        { label: "Fintech & Banking", section: "work" as SectionKey },
        { label: "Healthcare & Telehealth", section: "work" as SectionKey },
        { label: "Retail & E-Commerce", section: "work" as SectionKey },
        { label: "Startups & SaaS", section: "work" as SectionKey },
      ],
    },
    {
      key: "process",
      label: "Process",
      section: "process" as SectionKey,
      children: [
        { label: "Delivery Playbook", section: "process" as SectionKey },
        { label: "Design Systems", section: "services" as SectionKey },
        { label: "Scalable Architectures", section: "process" as SectionKey },
      ],
    },
    {
      key: "about",
      label: "About",
      section: "testimonials" as SectionKey,
      children: [
        { label: "Our Team", section: "testimonials" as SectionKey },
        { label: "How We Work", section: "process" as SectionKey },
        { label: "Engagement Models", section: "contact" as SectionKey },
      ],
    },
  ];

  const mobileNavItems: { label: string; section: SectionKey }[] = [
    { label: "Services", section: "services" },
    { label: "Process", section: "process" },
    { label: "Work", section: "work" },
    { label: "Clients", section: "testimonials" },
    { label: "Contact", section: "contact" },
  ];

  const handlePrevSlide = () => {
    setActiveSlideIndex((prev) => prev === 0 ? HERO_SLIDES.length - 1 : prev - 1);
  };

  const handleNextSlide = () => {
    setActiveSlideIndex((prev) => (prev + 1) % HERO_SLIDES.length);
  };

  /* -----------------------------------------------------
     PREMIUM RENDER
  ----------------------------------------------------- */
  return (
    <SafeAreaView style={styles.safe}>
      {/* PREMIUM HEADER */}
      <Animated.View
        style={[
          styles.header,
          scrolled && styles.headerScrolled,
          {
            paddingHorizontal: navPadding,
            opacity: headerAnim,
            transform: [
              {
                translateY: headerAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-20, 0],
                }),
              },
            ],
          },
        ]}
      >
        {/* Logo */}
        <TouchableOpacity
          style={styles.logoRow}
          activeOpacity={0.8}
          onPress={() => scrollToSection("hero")}
        >
          <View style={styles.logoContainer}>
  <Image
    source={CRAFTTECH_LOGO}
    style={styles.logoImage}
    resizeMode="contain"
  />
</View>
          <View>
            <Text style={styles.logoTitle}>CraftTech</Text>
            <Text style={styles.logoSubtitle}>Digital Product Studio</Text>
          </View>
        </TouchableOpacity>

        {/* Center Navigation */}
        {(isTablet || isDesktop) && (
          <View style={styles.navCenterRow}>
            {centerNavItems.map((item) => (
              <View key={item.key} style={styles.navCenterItem}>
                <TouchableOpacity
                  onPress={() => scrollToSection(item.section)}
                  onLongPress={() => setOpenDropdown(openDropdown === item.key ? null : item.key)}
                  delayLongPress={150}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.navCenterLabel, { fontSize: s(14) }]}>
                    {item.label}
                  </Text>
                </TouchableOpacity>

                {openDropdown === item.key && (
                  <View style={styles.dropdownMenu}>
                    {item.children.map((child) => (
                      <TouchableOpacity
                        key={child.label}
                        style={styles.dropdownItem}
                        onPress={() => {
                          scrollToSection(child.section);
                          setOpenDropdown(null);
                        }}
                      >
                        <Text style={[styles.dropdownText, { fontSize: s(13) }]}>
                          {child.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        {/* CTA / Mobile Menu */}
        {isTablet || isDesktop ? (
          <TouchableOpacity
            style={styles.navCta}
            onPress={() => scrollToSection("contact")}
          >
            <GradientView
              colors={[COLORS.neonSoft, COLORS.neon]}
              style={styles.navCtaGradient}
            >
              <Text style={[styles.navCtaText, { fontSize: s(14) }]}>
                Start your project
              </Text>
            </GradientView>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.burger}
            onPress={() => setNavOpen((prev) => !prev)}
          >
            <View style={[styles.burgerLine, navOpen && styles.burgerLineOpen]} />
            <View style={[styles.burgerLine, navOpen && styles.burgerLineOpen]} />
            <View style={[styles.burgerLine, navOpen && styles.burgerLineOpen]} />
          </TouchableOpacity>
        )}
      </Animated.View>

      {/* Mobile Navigation */}
      {!isTablet && !isDesktop && navOpen && (
        <View style={styles.mobileNav}>
          {mobileNavItems.map((item) => (
            <TouchableOpacity
              key={item.label}
              style={styles.mobileNavItem}
              onPress={() => scrollToSection(item.section)}
            >
              <Text style={[styles.mobileNavText, { fontSize: s(16) }]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            style={[styles.navCta, { marginTop: 16 }]}
            onPress={() => scrollToSection("contact")}
          >
            <GradientView
              colors={[COLORS.neonSoft, COLORS.neon]}
              style={styles.navCtaGradient}
            >
              <Text style={[styles.navCtaText, { fontSize: s(14) }]}>
                Start your project
              </Text>
            </GradientView>
          </TouchableOpacity>
        </View>
      )}

      {/* MAIN SCROLL CONTENT */}
      <AnimatedScrollView
        ref={scrollRef}
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false, listener: handleScroll }
        )}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
      >
        {/* PREMIUM HERO SECTION */}
        {/* PREMIUM HERO SECTION */}
<View
  onLayout={handleSectionLayout("hero")}
  style={[
    styles.hero,
    {
      height: heroHeight,
      minHeight: heroHeight,
      maxHeight: heroHeight,
      marginTop: 0,
      marginBottom: isMobile ? 40 : 80,
    },
  ]}
>
  <Video
    ref={videoRef}
    key={currentSlide.id}
    source={currentSlide.source}
    style={styles.heroVideo}
    shouldPlay
    isMuted
    isLooping
    resizeMode={ResizeMode.CONTAIN}
    onLoad={() => setVideoReady(true)}
    onError={(e) => console.log("Video error:", e)}
  />

  {/* Dim overlay */}
  <View style={styles.heroOverlay} />

  {/* Content wrapper constrained to 1280px */}
  <Animated.View
    style={[
      styles.heroContent,
      {
        opacity: heroAnim,
        transform: [
          {
            translateY: heroAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [40, 0],
            }),
          },
          {
            scale: heroAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0.97, 1],
            }),
          },
        ],
      },
    ]}
  >
    <View
      style={[
        styles.heroInner,
        containerStyle,
        { paddingHorizontal: navPadding },  // 🔥 same side padding as sections
      ]}
    >
      <View
        style={[
          styles.heroTextContainer,
          isMobile && {
            alignItems: "center",
            alignSelf: "center",
            width: "100%",
            marginHorizontal: 0,
          },
        ]}
      >
        <Text style={[styles.heroKicker, { fontSize: s(12) }]}>
          DIGITAL PRODUCT STUDIO
        </Text>

        <Text
          style={[
            styles.heroTitle,
            {
              fontSize: isMobile ? s(24) : isTablet ? s(32) : s(40),
              lineHeight: isMobile ? s(32) : isTablet ? s(40) : s(48),
              textAlign: isMobile ? "center" : "left",
            },
          ]}
        >
          {currentSlide.title}
        </Text>

        <Text
          style={[
            styles.heroSubtitle,
            {
              fontSize: isMobile ? s(13) : s(16),
              lineHeight: isMobile ? s(20) : s(24),
              textAlign: isMobile ? "center" : "left",
              maxWidth: 560,
            },
          ]}
        >
          {currentSlide.subtitle}
        </Text>

        <View
          style={[
            styles.heroCtaRow,
            isMobile && { flexDirection: "column", alignItems: "stretch" },
          ]}
        >
          <TouchableOpacity
            style={styles.heroPrimaryCta}
            onPress={() => scrollToSection("contact")}
          >
            <GradientView
              colors={[COLORS.neonSoft, COLORS.neon]}
              style={styles.ctaGradient}
            >
              <Text style={[styles.heroPrimaryText, { fontSize: s(16) }]}>
                Start your project
              </Text>
            </GradientView>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.heroSecondaryCta}
            onPress={() => scrollToSection("services")}
          >
            <Text style={[styles.heroSecondaryText, { fontSize: s(16) }]}>
              View our work
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  </Animated.View>

  {/* Hero Controls */}
  <View style={styles.heroControls}>
    <TouchableOpacity style={styles.heroArrow} onPress={handlePrevSlide}>
      <Text style={styles.heroArrowText}>‹</Text>
    </TouchableOpacity>

    <View style={styles.heroDots}>
      {HERO_SLIDES.map((_, index) => (
        <TouchableOpacity
          key={index}
          onPress={() => setActiveSlideIndex(index)}
        >
          <View
            style={[
              styles.heroDot,
              index === activeSlideIndex && styles.heroDotActive,
            ]}
          />
        </TouchableOpacity>
      ))}
    </View>

    <TouchableOpacity style={styles.heroArrow} onPress={handleNextSlide}>
      <Text style={styles.heroArrowText}>›</Text>
    </TouchableOpacity>
  </View>
</View>

        {/* PREMIUM SERVICES SECTION */}
        <View
          onLayout={handleSectionLayout("services")}
          style={[styles.section, { paddingVertical: sectionPadding }]}
        >
          <View style={[containerStyle, { paddingHorizontal: navPadding }]}>
            <Animated.View
              style={[
                styles.sectionHeader,
                {
                  opacity: servicesTitleAnim,
                  transform: [
                    {
                      translateY: servicesTitleAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [30, 0],
                      }),
                    },
                  ],
                },
              ]}
            >
              <Text style={[styles.sectionLabel, { fontSize: s(14) }]}>
                SERVICES
              </Text>
              <Text style={[styles.sectionTitle, { fontSize: s(32), lineHeight: s(40) }]}>
                End-to-end product delivery
              </Text>
              <Text style={[styles.sectionSubtitle, { fontSize: s(16), lineHeight: s(24) }]}>
                Strategy, design, and engineering for teams that ship serious software. 
                We work with the same stacks your in-house engineers already love.
              </Text>
            </Animated.View>

            <Animated.View
  style={[
    styles.servicesGrid,
    {
      opacity: serviceCardsAnim,
      transform: [
        {
          translateY: serviceCardsAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [40, 0],
          }),
        },
        {
          scale: serviceCardsAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [0.96, 1],
          }),
        },
      ],
    },
  ]}
>

              {[
                {
                  title: "Product Strategy",
                  description: "We help you validate ideas, prioritise features, and align stakeholders before a single line of code is written.",
                  tech: ["MVP Roadmaps", "Discovery Workshops", "Product Analytics"],
                  icon: "🎯",
                },
                {
                  title: "Design & Experience",
                  description: "Premium product UX for web and mobile — clean, modern, and optimised for real-world usage.",
                  tech: ["Figma", "Design Systems", "Prototypes"],
                  icon: "🎨",
                },
                {
                  title: "Engineering & Launch",
                  description: "TypeScript-first builds on React, React Native, Node.js, and AWS — with performance and reliability in mind.",
                  tech: ["React", "Node.js", "TypeScript", "AWS"],
                  icon: "⚡",
                },
              ].map((service, index) => (
                <View key={index} style={styles.serviceCard}>
                  <View style={styles.serviceHeader}>
                    <Text style={styles.serviceIcon}>{service.icon}</Text>
                    <Text style={styles.serviceNumber}>0{index + 1}</Text>
                  </View>
                  <Text style={styles.serviceCardTitle}>{service.title}</Text>
                  <Text style={styles.serviceCardBody}>{service.description}</Text>
                  <View style={styles.techRow}>
                    {service.tech.map((tech) => (
                      <View key={tech} style={styles.techPill}>
                        <Text style={styles.techPillText}>{tech}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              ))}
            </Animated.View>
          </View>
        </View>

        {/* PREMIUM PROCESS SECTION */}
        <View
          onLayout={handleSectionLayout("process")}
          style={[styles.section, { paddingVertical: sectionPadding }]}
        >
          <View style={[containerStyle, { paddingHorizontal: navPadding }]}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionLabel, { fontSize: s(14) }]}>PROCESS</Text>
              <Text style={[styles.sectionTitle, { fontSize: s(32), lineHeight: s(40) }]}>
                How we take you from brief to launch
              </Text>
              <Text style={[styles.sectionSubtitle, { fontSize: s(16), lineHeight: s(24) }]}>
                A simple, transparent flow that keeps founders, PMs, and CTOs in sync while we build.
              </Text>
            </View>

            <Animated.View
  style={[
    styles.processGrid,
    {
      opacity: processStepsAnim,
      transform: [
        {
          translateY: processStepsAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [60, 0],
          }),
        },
        {
          scale: processStepsAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [0.96, 1],
          }),
        },
      ],
    },
  ]}
>

              {[
                { step: "01 • Discover", title: "Research & Alignment", description: "Workshops, research, and requirements to get everyone aligned on the same problem and outcome." },
                { step: "02 • Design", title: "UX & Interface Design", description: "Flows, wireframes, and polished UI that reflect your brand and real user journeys." },
                { step: "03 • Build", title: "Engineering & Development", description: "Sprints with demos, reviews, and code that your in-house team can extend with confidence." },
                { step: "04 • Launch", title: "Deployment & Growth", description: "Rollout, monitoring, and iterative improvements based on real usage and product metrics." },
              ].map((item, index) => (
                <View key={index} style={styles.processCard}>
                  <Text style={styles.processStep}>{item.step}</Text>
                  <Text style={styles.processCardTitle}>{item.title}</Text>
                  <Text style={styles.processCardBody}>{item.description}</Text>
                </View>
              ))}
            </Animated.View>
          </View>
        </View>

        {/* PREMIUM WORK SECTION */}
        <View
          onLayout={handleSectionLayout("work")}
          style={[styles.section, { paddingVertical: sectionPadding }]}
        >
          <View style={[containerStyle, { paddingHorizontal: navPadding }]}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionLabel, { fontSize: s(14) }]}>WORK</Text>
              <Text style={[styles.sectionTitle, { fontSize: s(32), lineHeight: s(40) }]}>
                Products we've shipped with teams like yours
              </Text>
              <Text style={[styles.sectionSubtitle, { fontSize: s(16), lineHeight: s(24) }]}>
                A snapshot of the platforms we design and build for US startups, scaleups, and enterprises.
              </Text>
            </View>

            <View style={styles.filterRow}>
              {(["all", "web", "mobile", "ecommerce"] as PortfolioCategory[]).map((cat) => {
                const LABELS: Record<PortfolioCategory, string> = {
                  all: "All Projects",
                  web: "Web Apps",
                  mobile: "Mobile Apps",
                  ecommerce: "E-commerce",
                };
                const active = portfolioFilter === cat;
                return (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      styles.filterChip,
                      active && styles.filterChipActive,
                    ]}
                    onPress={() => setPortfolioFilter(cat)}
                  >
                    <Text
                      style={[
                        styles.filterChipText,
                        active && styles.filterChipTextActive,
                        { fontSize: s(14) },
                      ]}
                    >
                      {LABELS[cat]}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Animated.View
  style={[
    styles.portfolioGrid,
    {
      opacity: workItemsAnim,
      transform: [
        {
          translateY: workItemsAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [80, 0],
          }),
        },
        {
          scale: workItemsAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [0.96, 1],
          }),
        },
      ],
    },
  ]}
>

              {filteredPortfolio.map((item) => (
                <View key={item.id} style={styles.portfolioCard}>
                  <View style={styles.portfolioImageContainer}>
                    <Image
                      source={{ uri: item.img }}
                      style={styles.portfolioImage}
                      resizeMode="cover"
                    />
                    <View style={styles.portfolioOverlay}>
                      <Text style={styles.portfolioType}>{item.type}</Text>
                      <Text style={styles.portfolioTitle}>{item.title}</Text>
                    </View>
                  </View>
                  <View style={styles.portfolioContent}>
                    <Text style={styles.portfolioBody}>{item.description}</Text>
                    <View style={styles.portfolioMetrics}>
                      {item.metrics.map((metric) => (
                        <View key={metric} style={styles.metricPill}>
                          <Text style={styles.metricPillText}>{metric}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                </View>
              ))}
            </Animated.View>
          </View>
        </View>

        {/* PREMIUM TESTIMONIALS SECTION */}
        <View
          onLayout={handleSectionLayout("testimonials")}
          style={[styles.section, { paddingVertical: sectionPadding }]}
        >
          <View style={[containerStyle, { paddingHorizontal: navPadding }]}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionLabel, { fontSize: s(14) }]}>CLIENTS</Text>
              <Text style={[styles.sectionTitle, { fontSize: s(32), lineHeight: s(40) }]}>
                What partners say
              </Text>
              <Text style={[styles.sectionSubtitle, { fontSize: s(16), lineHeight: s(24) }]}>
                Real feedback from founders, PMs, and CTOs we've partnered with across the US.
              </Text>
            </View>

            <Animated.View
  style={[
    styles.testimonialsGrid,
    {
      opacity: testimonialsAnim,
      transform: [
        {
          translateY: testimonialsAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [60, 0],
          }),
        },
        {
          scale: testimonialsAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [0.96, 1],
          }),
        },
      ],
    },
  ]}
>

              {TESTIMONIALS.map((testimonial, index) => (
                <View key={testimonial.id} style={styles.testimonialCard}>
                  <Text style={styles.quoteMark}>"</Text>
                  <Text style={styles.testimonialText}>{testimonial.quote}</Text>
                  <View style={styles.testimonialFooter}>
                    <View>
                      <Text style={styles.testimonialName}>{testimonial.name}</Text>
                      <Text style={styles.testimonialRole}>{testimonial.role}</Text>
                      <Text style={styles.testimonialCompany}>{testimonial.company}</Text>
                    </View>
                  </View>
                </View>
              ))}
            </Animated.View>
          </View>
        </View>

        {/* PREMIUM CONTACT SECTION */}
        {/* PREMIUM CONTACT SECTION */}
<View
  onLayout={handleSectionLayout("contact")}
  style={[styles.section, { paddingVertical: sectionPadding }]}
>
  <View style={[containerStyle, { paddingHorizontal: navPadding }]}>
    <View style={styles.sectionHeader}>
      <Text style={[styles.sectionLabel, { fontSize: s(14) }]}>CONTACT</Text>
      <Text style={[styles.sectionTitle, { fontSize: s(32), lineHeight: s(40) }]}>
        Tell us what you're building
      </Text>
      <Text style={[styles.sectionSubtitle, { fontSize: s(16), lineHeight: s(24) }]}>
        Share a quick summary of your product, your team, and your timeline. 
        We'll respond with a short Loom and suggested next steps.
      </Text>
    </View>

    {/* ✅ responsive contact grid */}
    <View
      style={[
        styles.contactGrid,
        isMobile && {
          flexDirection: "column",
          gap: 24,
          marginTop: 16,
        },
      ]}
    >
      {/* LEFT: FORM */}
      <View style={styles.contactForm}>
        <View style={[styles.formRow, isMobile && { flexDirection: "column" }]}>
          <View style={styles.formGroup}>
            <Text style={styles.inputLabel}>Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Your name"
              placeholderTextColor={COLORS.subtle}
              value={form.name}
              onChangeText={(v) => handleFormChange("name", v)}
            />
          </View>
          <View style={styles.formGroup}>
            <Text style={styles.inputLabel}>Work email</Text>
            <TextInput
              style={styles.input}
              placeholder="you@company.com"
              placeholderTextColor={COLORS.subtle}
              keyboardType="email-address"
              autoCapitalize="none"
              value={form.email}
              onChangeText={(v) => handleFormChange("email", v)}
            />
          </View>
        </View>

        <View style={[styles.formRow, isMobile && { flexDirection: "column" }]}>
          <View style={styles.formGroup}>
            <Text style={styles.inputLabel}>Company</Text>
            <TextInput
              style={styles.input}
              placeholder="Company or startup name"
              placeholderTextColor={COLORS.subtle}
              value={form.company}
              onChangeText={(v) => handleFormChange("company", v)}
            />
          </View>
          <View style={styles.formGroup}>
            <Text style={styles.inputLabel}>Rough budget (USD)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 20k – 60k"
              placeholderTextColor={COLORS.subtle}
              value={form.budget}
              onChangeText={(v) => handleFormChange("budget", v)}
            />
          </View>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.inputLabel}>What are you looking to build?</Text>
          <TextInput
            style={[styles.input, styles.textarea]}
            placeholder="App, platform, redesign, MVP…"
            placeholderTextColor={COLORS.subtle}
            multiline
            numberOfLines={4}
            value={form.message}
            onChangeText={(v) => handleFormChange("message", v)}
          />
        </View>

        <TouchableOpacity
          style={styles.submitButton}
          onPress={handleSubmit}
        >
          <GradientView
            colors={[COLORS.neonSoft, COLORS.neon]}
            style={styles.submitGradient}
          >
            <Text style={styles.submitButtonText}>Send brief</Text>
          </GradientView>
        </TouchableOpacity>
      </View>

      {/* RIGHT: INFO CARD */}
      <View
        style={[
          styles.contactInfo,
          isMobile && { marginBottom: 8 }, // tiny space before footer on phones
        ]}
      >
        <View style={styles.contactInfoCard}>
          <Text style={styles.contactInfoTitle}>
            Based in Pakistan, building for the US.
          </Text>
          <Text style={styles.contactInfoBody}>
            We're a distributed product squad working with founders, product
            leaders, and CTOs across North America. Expect clear async
            communication and real momentum.
          </Text>

          <View style={styles.contactInfoBox}>
            <Text style={styles.contactInfoLabel}>Engagements</Text>
            <Text style={styles.contactInfoBody}>
              • 8–16 week product sprints{"\n"}
              • Dedicated PM, design, and engineering{"\n"}
              • Slack, Notion, and Loom-native collaboration
            </Text>
          </View>

          <View style={styles.contactInfoBox}>
            <Text style={styles.contactInfoLabel}>Contact</Text>
            <Text style={styles.contactInfoBody}>
              hello@crafttech.studio{"\n"}
              Mon – Fri • US & PK friendly hours
            </Text>
          </View>
        </View>
      </View>
    </View>
  </View>
</View>

        {/* PREMIUM FOOTER */}
        <Animated.View
          style={[
            styles.footer,
            {
              opacity: footerAnim,
              transform: [
                {
                  translateY: footerAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [40, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <View style={[containerStyle, { paddingHorizontal: navPadding }]}>
          <View style={[styles.footerContent, isMobile && { paddingVertical: 32 }]}>
          <View
  style={[
    styles.footerMain,
    isMobile && {
      flexDirection: "column",
      alignItems: "flex-start",
      gap: 24,
    },
  ]}
>
              <View style={styles.footerBrand}>
  <View style={styles.footerLogoContainer}>
    <Image
      source={CRAFTTECH_LOGO}
      style={styles.footerLogoImage}
      resizeMode="contain"
    />
  </View>

  <View>
    <Text style={styles.footerTitle}>CraftTech</Text>
    <Text style={styles.footerTagline}>
      Building premium digital products for US startups, founders, and CTOs.
    </Text>
  </View>
</View>


<View
  style={[
    styles.footerSocial,
    isMobile && {
      flexWrap: "wrap",
      justifyContent: "flex-start",
      rowGap: 8,
    },
  ]}
>
  <TouchableOpacity
    style={[
      styles.socialIcon,
      isMobile && { paddingHorizontal: 12, paddingVertical: 6 },
    ]}
    onPress={() => Linking.openURL("https://twitter.com/your-handle")}
  >
    <View style={styles.socialDot} />
    <Text style={styles.socialIconLabel}>Twitter</Text>
  </TouchableOpacity>

  <TouchableOpacity
    style={[
      styles.socialIcon,
      isMobile && { paddingHorizontal: 12, paddingVertical: 6 },
    ]}
    onPress={() => Linking.openURL("https://www.linkedin.com/in/your-handle")}
  >
    <View style={styles.socialDot} />
    <Text style={styles.socialIconLabel}>LinkedIn</Text>
  </TouchableOpacity>

  <TouchableOpacity
    style={[
      styles.socialIcon,
      isMobile && { paddingHorizontal: 12, paddingVertical: 6 },
    ]}
    onPress={() => Linking.openURL("https://github.com/your-handle")}
  >
    <View style={styles.socialDot} />
    <Text style={styles.socialIconLabel}>GitHub</Text>
  </TouchableOpacity>
</View>

              <View style={styles.footerDivider} />

              <View style={styles.footerBottom}>
                <Text style={styles.footerCopy}>
                  © {new Date().getFullYear()} CraftTech. All rights reserved.
                </Text>
                <Text style={styles.footerCopy}>
                  Designed & built with TypeScript, React Native, and Expo Web.
                </Text>
              </View>
            </View>
          </View>
          </View>
        </Animated.View>
      </AnimatedScrollView>
    </SafeAreaView>
  );
};

export default App;

/* -----------------------------------------------------
   PREMIUM STYLES
----------------------------------------------------- */
const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 80,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    zIndex: 100,
    backgroundColor: 'transparent',
  },
  headerScrolled: {
    backgroundColor: COLORS.bg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  logoRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  logoImage: {
    width: "100%",
    height: "100%",
  },  
  logoContainer: {
    width: 40,
    height: 40,
    marginRight: 12,
    borderRadius: 10,
    overflow: "hidden",
  },
  logoGradient: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  logoText: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: "800",
  },
  logoTitle: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: "700",
    letterSpacing: -0.5,
  },
  logoSubtitle: {
    color: COLORS.textMuted,
    fontSize: 11,
    letterSpacing: 0.5,
  },
  navCenterRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 32,
  },
  navCenterItem: {
    position: "relative",
  },
  navCenterLabel: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: "500",
    letterSpacing: -0.2,
  },
  dropdownMenu: {
    position: "absolute",
    top: 40,
    left: -16,
    backgroundColor: COLORS.cardSoft,
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
    minWidth: 200,
    zIndex: 1000,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 16,
  },
  dropdownItem: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  dropdownText: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: "400",
  },
  navCta: {
    borderRadius: 12,
    overflow: "hidden",
  },
  navCtaGradient: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  navCtaText: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: "600",
  },
  burger: {
    padding: 8,
    width: 32,
    height: 32,
    justifyContent: "space-between",
  },
  burgerLine: {
    height: 2,
    backgroundColor: COLORS.text,
    borderRadius: 2,
  },
  burgerLineOpen: {
    backgroundColor: COLORS.neon,
  },
  mobileNav: {
    position: "absolute",
    top: 80,
    left: 0,
    right: 0,
    zIndex: 90,
    backgroundColor: COLORS.bg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingHorizontal: 20,
    paddingVertical: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  mobileNavItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.05)",
  },
  mobileNavText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: "500",
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 100,
    backgroundColor: COLORS.bg,
  },

  // PREMIUM HERO
  hero: {
    position: "relative",
    width: "100%",
    borderRadius: 0,   // no rounded corners
    overflow: "hidden",
    marginVertical: 0, // flush with page
  },    
  heroVideo: {
    width: "100%",
    height: "100%",
    alignSelf: "center",
  },
  heroOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    // lower opacity from 0.85 → 0.45
    backgroundColor: "rgba(5,8,7,0.18)",
  },  
  heroContent: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "stretch",
    paddingHorizontal: 0,
  },  
  heroInner: {
    flex: 1,
    justifyContent: "center",
    alignItems: "flex-start", // text left on desktop
  },
  heroTextContainer: {
    maxWidth: 640,
    alignItems: "flex-start",
    backgroundColor: "transparent", // no card
    paddingHorizontal: 0,
    paddingVertical: 0,
    borderRadius: 0,
    borderWidth: 0,
    borderColor: "transparent",
  },
   
  heroKicker: {
    color: COLORS.neon,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 2,
    textTransform: "uppercase",
    marginBottom: 16,
  },
  heroTitle: {
    color: COLORS.text,
    fontWeight: "700",      // slightly lighter = more premium
    textAlign: "left",
    letterSpacing: -0.5,    // softer
    marginBottom: 20,
  },
  heroSubtitle: {
    color: COLORS.textMuted,
    textAlign: "left",
    fontWeight: "400",
    marginBottom: 28,
    opacity: 0.9,
  },    
  heroCtaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  heroPrimaryCta: {
    borderRadius: 999,
    overflow: "hidden",
  },
  ctaGradient: {
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  heroPrimaryText: {
    color: COLORS.bg,
    fontSize: 15,
    fontWeight: "600",
  },
  heroSecondaryCta: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: "rgba(10,15,13,0.85)",
  },
  heroSecondaryText: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: "500",
  },  
  heroControls: {
    position: "absolute",
    bottom: 32,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 32,
  },
  heroArrow: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.4)",
    alignItems: "center",
    justifyContent: "center",
  },
  heroArrowText: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: "400",
  },  
  heroDots: {
    flexDirection: "row",
    gap: 8,
  },
  heroDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.3)",
  },
  heroDotActive: {
    backgroundColor: COLORS.neon,
    width: 24,
  },

  // SECTIONS
  section: {
    paddingVertical: 80,
  },
  sectionHeader: {
    marginBottom: 60,
    alignItems: "center",
    textAlign: "center",
  },
  sectionLabel: {
    color: COLORS.neon,
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 2,
    textTransform: "uppercase",
    marginBottom: 12,
  },
  sectionTitle: {
    color: COLORS.text,
    fontSize: 32,
    fontWeight: "800",
    textAlign: "center",
    letterSpacing: -1,
    marginBottom: 16,
  },
  sectionSubtitle: {
    color: COLORS.textMuted,
    fontSize: 16,
    textAlign: "center",
    maxWidth: 600,
    lineHeight: 24,
  },

  // SERVICES
  servicesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 24,
    justifyContent: "center",
  },
  serviceCard: {
    flex: 1,
    minWidth: 300,
    maxWidth: 400,
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 32,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  serviceHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  serviceIcon: {
    fontSize: 32,
  },
  serviceNumber: {
    color: COLORS.neon,
    fontSize: 14,
    fontWeight: "700",
  },
  serviceCardTitle: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 12,
  },
  serviceCardBody: {
    color: COLORS.textMuted,
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 20,
  },

  // PROCESS
  processGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 24,
    justifyContent: "center",
  },
  processCard: {
    flex: 1,
    minWidth: 280,
    maxWidth: 320,
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 32,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  processStep: {
    color: COLORS.neon,
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 8,
  },
  processCardTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 12,
  },
  processCardBody: {
    color: COLORS.textMuted,
    fontSize: 14,
    lineHeight: 22,
  },

  // WORK
  filterRow: {
    flexDirection: "row",
    justifyContent: "center",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 40,
  },
  filterChip: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
  },
  filterChipActive: {
    backgroundColor: COLORS.neon,
    borderColor: COLORS.neon,
  },
  filterChipText: {
    color: COLORS.textMuted,
    fontSize: 14,
    fontWeight: "500",
  },
  filterChipTextActive: {
    color: COLORS.bg,
    fontWeight: "600",
  },
  portfolioGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 24,
    justifyContent: "center",
  },
  portfolioCard: {
    flex: 1,
    minWidth: 350,
    maxWidth: 400,
    backgroundColor: COLORS.card,
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  portfolioImageContainer: {
    position: "relative",
    width: "100%",
    height: 240,
  },
  portfolioImage: {
    width: "100%",
    height: "100%",
  },
  portfolioOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 24,
    backgroundColor: "rgba(0,0,0,0.7)",
  },
  portfolioType: {
    color: COLORS.neon,
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 8,
  },
  portfolioTitle: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: "700",
  },
  portfolioContent: {
    padding: 24,
  },
  portfolioBody: {
    color: COLORS.textMuted,
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 20,
  },
  portfolioMetrics: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

  // TESTIMONIALS
  testimonialsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 24,
    justifyContent: "center",
  },
  testimonialCard: {
    flex: 1,
    minWidth: 320,
    maxWidth: 400,
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 32,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  quoteMark: {
    color: COLORS.neon,
    fontSize: 48,
    fontWeight: "700",
    marginBottom: 16,
  },
  testimonialText: {
    color: COLORS.text,
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 24,
    fontStyle: "italic",
  },
  testimonialFooter: {
    flexDirection: "row",
    alignItems: "center",
  },
  testimonialName: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: "700",
  },
  testimonialRole: {
    color: COLORS.neon,
    fontSize: 14,
    marginTop: 2,
  },
  testimonialCompany: {
    color: COLORS.textMuted,
    fontSize: 14,
    marginTop: 2,
  },

  // CONTACT
  contactGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 48,
  },
  contactForm: {
    flex: 2,
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 32,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  formRow: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 16,
  },
  formGroup: {
    flex: 1,
  },
  inputLabel: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  input: {
    backgroundColor: COLORS.bgSoft,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    color: COLORS.text,
    fontSize: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  textarea: {
    height: 120,
    textAlignVertical: "top",
  },
  submitButton: {
    borderRadius: 12,
    overflow: "hidden",
    marginTop: 24,
  },
  submitGradient: {
    paddingVertical: 16,
    alignItems: "center",
  },
  submitButtonText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: "600",
  },
  contactInfo: {
    flex: 1,
    minWidth: 300,
    paddingHorizontal: 4, // tiny outer padding so card doesn't touch edges
  },  
  contactInfoTitle: {
    color: COLORS.text,
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 16,
  },
  contactInfoBody: {
    color: COLORS.textMuted,
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 24,
  },
  contactInfoBox: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  contactInfoCard: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
  },  
  contactInfoLabel: {
    color: COLORS.neon,
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 1,
  },

  // TECH PILLS & METRICS
  techRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  techPill: {
    backgroundColor: COLORS.bgSoft,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  techPillText: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: "500",
  },
  metricPill: {
    backgroundColor: COLORS.bgSoft,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  metricPillText: {
    color: COLORS.neon,
    fontSize: 12,
    fontWeight: "600",
  },

  // FOOTER
  footer: {
    backgroundColor: COLORS.bgSoft,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    marginTop: 40,
  },
  footerContent: {
    paddingVertical: 60,
  },
  footerMain: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 40,
    flexWrap: "wrap",   // ✅ allows wrapping on narrow screens
    rowGap: 24,
  },  
  footerLogoContainer: {
    width: 44,
    height: 44,
    marginRight: 14,
    borderRadius: 12,
    overflow: "hidden",
  },
  footerLogoImage: {
    width: "100%",
    height: "100%",
  },  
  footerBrand: {
    flex: 2,
    flexDirection: "row",
    alignItems: "flex-start",
  },
  footerTitle: {
    color: COLORS.text,
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 8,
  },
  footerTagline: {
    color: COLORS.textMuted,
    fontSize: 16,
    lineHeight: 24,
    maxWidth: 300,
  },
  footerSocial: {
    flexDirection: "row",
    gap: 12,
  },
  
  socialIcon: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(148,163,184,0.35)", // soft border
    backgroundColor: "rgba(10,15,13,0.7)",  // subtle dark
  },
  
  socialDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.neon,
    marginRight: 8,
  },
  
  socialIconLabel: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: "500",
  },  
  socialIconText: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: "500",
  },
  footerDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 40,
  },
  footerBottom: {
    alignItems: "center",
  },
  footerCopy: {
    color: COLORS.textMuted,
    fontSize: 14,
    textAlign: "center",
    marginBottom: 8,
  },
});