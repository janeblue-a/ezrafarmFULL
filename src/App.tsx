import "./App.css";
import { useState, useEffect, Fragment, useRef } from "react";
import sheep from "./Images/sheep.png";
import moses from "./Images/moses.png";
import baldNormal from "./Images/bald.png";
import goldenSheep from "./Images/goldenSheep.png";
import ghostSheep from "./Images/ghostSheep.png";
import baldGolden from "./Images/goldBald.png";
import baldGhost from "./Images/ghostBald.png";
import denisSheep from "./Images/denisSheep.png";
import baldDenis from "./Images/baldDenis.png";
import crownSheep from "./Images/crownSheep.png";
import baldCrown from "./Images/crownbald.png";
import coyote from "./Images/VespaCoyote.png";
import oncemore from "./Images/oncemore.png";
import rainbpw from "./Images/Rainbowcina.png";

let shopIsOpen = false;

type AchievementId = "firstSheep" | "shepherd" | "pissyellow" | "overflow";

type GameState = {
  sheepCount: number;
  money: number;
  woolSold: number;
  sheepTypes: SheepType[];
};

type Achievement = {
  id: AchievementId;
  name: string;
  description: string;
  check: (state: GameState) => boolean;
  reward?: (game: RewardContext) => void;
};

type RewardContext = {
  addMoney: (amount: number) => void;
  addCarrots: (amount: number) => void;
  addTrees: (amount: number) => void;
};

const achievementsList: Achievement[] = [
  {
    id: "firstSheep",
    name: "A New Beginning",
    description: "Own more than one sheep",
    check: (s) => s.sheepCount > 1,
    reward: (g) => g.addMoney(50),
  },
  {
    id: "shepherd",
    name: "Sheep Army",
    description: "Own 10 sheep",
    check: (s) => s.sheepCount >= 10,
    reward: (g) => g.addMoney(50),
  },
  {
    id: "pissyellow",
    name: "Shiny!",
    description: "Discover a golden sheep",
    check: (s) => s.sheepTypes.includes("golden"),
    reward: (g) => g.addMoney(50),
  },
  {
    id: "overflow",
    name: "What is Cost",
    description: "Reach $1000",
    check: (s) => s.money >= 1000,
    reward: (g) => g.addMoney(50),
  },
];

const sheepCatalogueText: Record<SheepType, string[]> = {
  normal: [
    "Just a regular sheep.",
    "Nothing special. Probably.",
    "Certified fluffy.",
    "Average sheep moment.",
    "Did you think it would transform?",
  ],

  golden: [
    "12 carrot.",
    "worth more than you",
    "Shiny creature.",
    "The economy loves this one.",
  ],

  ghost: [
    "worth the wait",
    "why is it translucent",
    "is this thing alive?",
    "you can shear a ghost???",
  ],

  denis: ["edgy", "kind capo", "brooding creature", "might heal others"],

  crown: [
    "She-ep used to rule this world",
    "it's araya sheep",
    "thanks skitty_gnocchi for helping test the game!",
    "those who bow",
  ],
};

const sheepConfig = {
  normal: {
    image: sheep,
    baldImage: baldNormal,
    woolValue: 40,
    hungerDrain: 1,
    carrotValue: 15,
    treeValue: 35,
    spawnChance: 0.8,
  },
  crown: {
    image: crownSheep,
    baldImage: baldCrown,
    woolValue: 65,
    hungerDrain: 0.8,
    carrotValue: 17,
    treeValue: 38,
    spawnChance: 0.05,
  },
  golden: {
    image: goldenSheep,
    baldImage: baldGolden,
    woolValue: 120,
    hungerDrain: 1,
    carrotValue: 15,
    treeValue: 35,
    spawnChance: 0.02,
  },
  ghost: {
    image: ghostSheep,
    baldImage: baldGhost,
    woolValue: 15,
    hungerDrain: 0,
    carrotValue: 25,
    treeValue: 15,
    spawnChance: 0.06,
  },
  denis: {
    image: denisSheep,
    baldImage: baldDenis,
    woolValue: 50,
    hungerDrain: 1.25,
    carrotValue: 25,
    treeValue: 17,
    spawnChance: 0.07,
    passive: {
      type: "groupHeal",
      minInterval: 20000,
      maxInterval: 30000,
      minHeal: 8,
      maxHeal: 12,
    },
  },
};

type SheepType = keyof typeof sheepConfig;

const sheepLines = {
  normal: [
    "baa",
    "munching",
    "soft bleat",
    "hello farmer",
    "chewing",
    "fluffy",
    "i want a chair",
  ],
  hungry: [
    "need food",
    "so empty",
    "stomach hurts",
    "please feed",
    "man this person sucks",
    "baaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaAAAAAAAA",
  ],
  full: ["full.", "happy.", "content.", "round.", "thank you farmer"],
  bald: ["cold.", "where wool?", "breezy…"],
  funny: [
    "taxes?",
    "existence is hay.",
    "baa means baa.",
    "i still see your shadows in my wool",
    "I've had ENOUGH of this!!!",
  ],
  ominous: [
    "did moses just blink?",
    "our food is limited, farmer",
    "counting...",
    "arghhhhh im sheeping it so goooood",
    "feed me THIS INSTANT",
    "make me a sandwich",
  ],
};

const randomFrom = (arr: string | any[]) =>
  arr[Math.floor(Math.random() * arr.length)];

interface Sheep {
  id: number;
  type: SheepType;
  hunger: number;
  image: string;
  isBald: boolean;
  speech: string;
  name: string;
  regrowAt?: number | null;
  nextPassiveAt?: number | null;
}

const maxRep = 1.2;

export default function App() {
  const isGameOver = useRef(false);

  const rollSheepType = (): SheepType => {
    const r = Math.random();
    let cumulative = 0;

    for (const type in sheepConfig) {
      cumulative += sheepConfig[type as SheepType].spawnChance;
      if (r < cumulative) {
        return type as SheepType;
      }
    }

    return "normal";
  };

  const createSheep = (): Sheep => {
    const sheepType = rollSheepType();
    const config = sheepConfig[sheepType];

    return {
      id: Date.now() + Math.random(),
      type: sheepType,
      hunger: 100,
      image: config.image,
      isBald: false,
      speech: "",
      name: "Unnamed Sheep",
    };
  };

  useEffect(() => {
    const repInterval = setInterval(() => {
      setSheeps((prev) => {
        const healthySheep = prev.filter((s) => s.hunger > 80).length;

        if (healthySheep >= prev.length && prev.length > 2) {
          setRep((r) => Math.min(maxRep, r + 0.02));
        }

        return prev;
      });
    }, 8000);

    return () => clearInterval(repInterval);
  }, []);

  useEffect(() => {
    const regrowInterval = setInterval(() => {
      setSheeps((prev) =>
        prev.map((s) => {
          if (s.isBald && s.regrowAt && Date.now() > s.regrowAt) {
            return {
              ...s,
              isBald: false,
              regrowAt: null,
              image: sheepConfig[s.type].image,
            };
          }
          return s;
        }),
      );
    }, 1000);
    return () => clearInterval(regrowInterval);
  }, []);

  type Coyote = {
    id: number;
    x: number;
    y: number;
    targetSheepId: number;
  };

  const [sheeps, setSheeps] = useState<Sheep[]>([createSheep()]);

  const [coyotes, setCoyotes] = useState<Coyote[]>([]);
  const [carrotCount, setCarrotCount] = useState(10);
  const [carrotOpen, setCarrotOpen] = useState(false);
  const [treeOpen, setTreeOpen] = useState(false);
  const [money, setMoney] = useState(125);
  const [shop, setShop] = useState("invis");
  const [treevis, setTreevis] = useState("locked");
  const [treeCount, setTreeCount] = useState(0);
  const [dialogueCount, setDialogueCount] = useState(0);
  const [dialougeText, setDialogueText] = useState("im moses");
  const [mosesHere, setMosesHere] = useState("visible");
  const [isLoaded, setIsLoaded] = useState(false);
  const [SaveGameUse, setSaveGameUse] = useState("Save Game");
  const [shearsEquipped, setShearsEquipped] = useState(false);
  const [currentEvent, setCurrentEvent] = useState<
    null | "famine" | "coyotes" | "oncemore"
  >(null);
  const [catalogueFlavor, setCatalogueFlavor] = useState<
    Record<SheepType, string>
  >({
    normal: "",
    golden: "",
    ghost: "",
    denis: "",
    crown: "",
  });
  const [marketOpen, setMarketOpen] = useState(false);
  const [achievements, setAchievements] = useState<Record<string, boolean>>({});
  const [woolSold, setWoolSold] = useState(0);
  const [eventTimeLeft, setEventTimeLeft] = useState(0);
  const [timeOfDay, setTimeOfDay] = useState(0);
  const [oncemoreIcons, setOncemoreIcons] = useState<
    { id: number; x: number; y: number }[]
  >([]);

  const [oncemoreClicks, setOncemoreClicks] = useState(0);
  const [woolInventory, setWoolInventory] = useState({
    normal: 0,
    golden: 0,
    ghost: 0,
    denis: 0,
    crown: 0,
  });

  const [woolMarket, setWoolMarket] = useState({
    normal: sheepConfig.normal.woolValue,
    golden: sheepConfig.golden.woolValue,
    ghost: sheepConfig.ghost.woolValue,
    denis: sheepConfig.denis.woolValue,
    crown: sheepConfig.crown.woolValue,
  });
  const [rep, setRep] = useState(1);
  const [discoveredSheep, setDiscoveredSheep] = useState<
    Record<SheepType, boolean>
  >({
    normal: false,
    golden: false,
    ghost: false,
    denis: false,
    crown: false,
  });
  const [page, setPage] = useState<"game" | "catalogue" | "achievements">(
    "game",
  );
  type Toast = {
    id: number;
    title: string;
    text: string;
    moretext?: string;
    input?: boolean;
    onSubmit?: (value: string) => void;
  };

  const [toasts, setToasts] = useState<Toast[]>([]);
  const [toastInput, setToastInput] = useState("");

  const showToast = (title: string, text: string, moretext: string) => {
    const id = Date.now() + Math.random();

    setToasts((prev) => [...prev, { id, title, text, moretext }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  };

  useEffect(() => {
    const state: GameState = {
      sheepCount: sheeps.length,
      money,
      woolSold,
      sheepTypes: sheeps.map((s) => s.type),
    };

    checkAchievements(state);
  }, [sheeps, money, woolSold]);
  const checkAchievements = (state: GameState) => {
    setAchievements((prev) => {
      const updated = { ...prev };

      achievementsList.forEach((a) => {
        if (!updated[a.id] && a.check(state)) {
          updated[a.id] = true;

          showToast("Oooooh! New achievement:", a.name, a.description);

          if (a.reward) {
            a.reward({
              addMoney: (amount) => setMoney((m) => m + amount),
              addCarrots: (amount) => setCarrotCount((c) => c + amount),
              addTrees: (amount) => setTreeCount((t) => t + amount),
            });
          }
        }
      });

      return updated;
    });
  };
  useEffect(() => {
    sheeps.forEach((s) => {
      setDiscoveredSheep((prev) => {
        if (!prev[s.type]) {
          setRep((r) => Math.min(maxRep, r + 0.02));
        }

        return {
          ...prev,
          [s.type]: true,
        };
      });
    });
  }, [sheeps]);

  const generateMarketPrices = () => {
    setWoolMarket({
      normal: Math.floor(
        sheepConfig.normal.woolValue * ((0.7 + Math.random() * 0.6) * rep),
      ),
      golden: Math.floor(
        sheepConfig.golden.woolValue * ((0.7 + Math.random() * 0.65) * rep),
      ),
      ghost: Math.floor(
        sheepConfig.ghost.woolValue * ((0.7 + Math.random() * 0.6) * rep),
      ),
      denis: Math.floor(
        sheepConfig.denis.woolValue * ((0.7 + Math.random() * 0.6) * rep),
      ),
      crown: Math.floor(
        sheepConfig.crown.woolValue * ((0.7 + Math.random() * 0.6) * rep),
      ),
    });
  };

  useEffect(() => {
    const marketInterval = setInterval(() => {
      generateMarketPrices();
    }, 7000);

    return () => clearInterval(marketInterval);
  }, []);

  type TimePhase = "sunrise" | "day" | "sunset" | "night";

  const getTimePhase = (time: number): TimePhase => {
    if (time < 40) return "sunrise";
    if (time < 120) return "day";
    if (time < 160) return "sunset";
    return "night";
  };

  const timePhase = getTimePhase(timeOfDay);

  useEffect(() => {
    if (!isLoaded || page !== "game") return;

    const dayInterval = setInterval(() => {
      setTimeOfDay((prev) => (prev + 1) % 240);
    }, 550);

    return () => clearInterval(dayInterval);
  }, [isLoaded, page]);

  useEffect(() => {
    if (page !== "game") return;
    const interval = setInterval(
      () => {
        setSheeps((prevSheep) => {
          const denisSheep = prevSheep.filter(
            (s) => s.type === "denis" && !s.isBald,
          );

          if (denisSheep.length === 0) return prevSheep;

          return prevSheep.map((s) => {
            const config = sheepConfig["denis"];
            const passive = config.passive;
            if (!passive) return s;

            const healAmount =
              Math.floor(
                Math.random() * (passive.maxHeal - passive.minHeal + 1),
              ) + passive.minHeal;

            return {
              ...s,
              hunger: Math.min(100, s.hunger + healAmount),
            };
          });
        });
      },
      Math.random() * 10000 + 20000,
    );
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    document.body.classList.remove("sunrise", "day", "sunset", "night");
    document.body.classList.add(timePhase);
  }, [timePhase]);

  const saveGame = () => {
    const saveData = {
      sheeps,
      carrotCount,
      treeCount,
      money,
      treevis,
      dialogueCount,
      dialougeText,
      mosesHere,
      currentEvent,
      eventTimeLeft,
      woolInventory,
      rep,
      discoveredSheep,
      achievements,
    };
    localStorage.setItem("ezrasheepsave", JSON.stringify(saveData));
  };

  useEffect(() => {
    if (!isLoaded || isGameOver.current) return;
    saveGame();
  }, [
    sheeps,
    carrotCount,
    treeCount,
    money,
    treevis,
    dialogueCount,
    dialougeText,
    mosesHere,
    currentEvent,
    eventTimeLeft,
    shearsEquipped,
    woolInventory,
    rep,
    achievements,
  ]);

  useEffect(() => {
    const savedGame = localStorage.getItem("ezrasheepsave");
    if (savedGame) {
      const data = JSON.parse(savedGame);
      const now = Date.now();

      setSheeps(
        data.sheeps?.map((s: any) => {
          const type: SheepType = s.type ?? "normal";

          const isStillBald = s.regrowAt ? now < s.regrowAt : false;

          return {
            ...s,
            type,
            name: s.name ?? "Unnamed Sheep",
            isBald: isStillBald,
            regrowAt: isStillBald ? s.regrowAt : null,
            speech: "",
            image: isStillBald
              ? sheepConfig[type].baldImage
              : sheepConfig[type].image,
          };
        }) ?? [createSheep()],
      );
      setDiscoveredSheep(
        data.discoveredSheep ?? {
          normal: false,
          golden: false,
          ghost: false,
          denis: false,
        },
      );
      setAchievements(data.achievements ?? {});
      setRep(data.rep ?? 1);
      setCarrotCount(data.carrotCount ?? 10);
      setTreeCount(data.treeCount ?? 0);
      setMoney(data.money ?? 100);
      setTreevis(data.treevis ?? "locked");
      setDialogueCount(data.dialogueCount ?? 0);
      setDialogueText(data.dialougeText ?? "im moses");
      setMosesHere(data.mosesHere ?? "visible");
      setCurrentEvent(data.currentEvent ?? null);
      setEventTimeLeft(data.eventTimeLeft ?? 0);
      setWoolInventory(
        data.woolInventory ?? {
          normal: 0,
          golden: 0,
          ghost: 0,
          denis: 0,
          crown: 0,
        },
      );
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (!isLoaded || page !== "game") return;

    const interval = setInterval(() => {
      setSheeps((prevSheeps) => {
        const afterHunger = prevSheeps.map((s) => {
          const config = sheepConfig[s.type];

          if (config.hungerDrain === 0) return s;

          let hungerLoss = config.hungerDrain;

          if (currentEvent === "famine") hungerLoss += 1.5;
          if (timePhase === "night" && s.isBald) hungerLoss += 1;

          return { ...s, hunger: Math.max(0, s.hunger - hungerLoss) };
        });
        const afterCoyotes =
          currentEvent === "coyotes"
            ? afterHunger.filter((s) => {
                if (s.hunger < 65) {
                  const wolfChance = 0.27;
                  if (Math.random() < wolfChance) {
                    return false;
                  }
                }
                return true;
              })
            : afterHunger;

        const deadSheep = afterCoyotes.filter((s) => s.hunger <= 0);
        const aliveSheep = afterCoyotes.filter((s) => s.hunger > 0);

        if (deadSheep.length > 0) {
          const penaltyPerSheep = 175;
          setMoney((prev) =>
            Math.max(0, prev - deadSheep.length * penaltyPerSheep),
          );
          setRep((prev) => Math.max(0, prev - deadSheep.length * 0.2));
        }

        if (aliveSheep.length === 0) {
          isGameOver.current = true;
          clearInterval(interval);
          alert(
            "why you letting your sheeps starve? if you wanna, let's try again",
          );
          localStorage.removeItem("ezrasheepsave");
          window.location.reload();
          return prevSheeps;
        }

        return aliveSheep;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isLoaded, currentEvent, timePhase, page]);

  useEffect(() => {
    if (!isLoaded) return;

    if (rep <= 0) {
      isGameOver.current = true;

      alert(
        "you shouldntve killed all those sheep man, nobody's buying anymore",
      );

      localStorage.removeItem("ezrasheepsave");
      window.location.reload();
    }
  }, [rep, isLoaded, page]);

  useEffect(() => {
    if (currentEvent === "coyotes") {
      const newCoyotes = Array.from({ length: 4 }, () => {
        const target = randomFrom(sheeps);

        return {
          id: Date.now() + Math.random(),
          x: Math.random() * window.innerWidth,
          y: 50,
          targetSheepId: target.id,
        };
      });

      setCoyotes(newCoyotes);
    } else {
      setCoyotes([]);
    }
  }, [currentEvent]);
  useEffect(() => {
    if (currentEvent !== "coyotes") return;

    const interval = setInterval(() => {
      setCoyotes((prev) =>
        prev.map((c) => {
          const target = sheeps.find((s) => s.id === c.targetSheepId);
          if (!target) return c;

          const dx = Math.random() * 4 - 2;
          const dy = Math.random() * 4;

          return {
            ...c,
            x: c.x + dx,
            y: c.y + dy,
          };
        }),
      );
    }, 100);

    return () => clearInterval(interval);
  }, [currentEvent, sheeps]);
  useEffect(() => {
    if (currentEvent !== "coyotes") return;

    const stealInterval = setInterval(() => {
      if (coyotes.length === 0) return;

      setSheeps((prev) => {
        if (prev.length === 0) return prev;

        const index = Math.floor(Math.random() * prev.length);
        const newSheep = [...prev];
        newSheep.splice(index, 1);

        return newSheep;
      });
    }, 5500);

    return () => clearInterval(stealInterval);
  }, [currentEvent, coyotes]);
  useEffect(() => {
    if (!isLoaded || page !== "game") return;

    const eventRoll = setInterval(() => {
      setCurrentEvent((prev) => {
        if (prev !== null) return prev;

        const roll = Math.random();

        if (roll < 0.005) {
          setEventTimeLeft(40);
          document.body.classList.add("famine");
          return "famine";
        }
        if (roll < 0.01) {
          setEventTimeLeft(999);
          document.body.classList.add("oncemore");
          return "oncemore";
        }

        if (roll < 0.018) {
          setEventTimeLeft(25);
          document.body.classList.add("coyotes");
          return "coyotes";
        }

        return prev;
      });
    }, 5500);

    return () => clearInterval(eventRoll);
  }, [isLoaded, page]);

  useEffect(() => {
    if (!currentEvent) return;

    const timer = setInterval(() => {
      setEventTimeLeft((prev) => {
        if (prev <= 1) {
          setCurrentEvent(null);
          if (currentEvent === "famine" && eventTimeLeft <= 1) {
            setRep((r) => Math.min(maxRep, r + 0.03));
          }
          document.body.classList.remove("famine");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [currentEvent]);

  const carrotClick = () => {
    if (carrotCount > 0) {
      setCarrotOpen(!carrotOpen);
      setTreeOpen(false);
      setShearsEquipped(false);
    }
  };

  const treeClick = () => {
    if (treeCount > 0) {
      setTreeOpen(!treeOpen);
      setCarrotOpen(false);
      setShearsEquipped(false);
    }
  };

  const scareCoyote = (id: number) => {
    setCoyotes((prev) => prev.filter((c) => c.id !== id));
  };

  useEffect(() => {
    if (currentEvent === "oncemore") {
      const icons = Array.from({ length: 10 }, () => ({
        id: Date.now() + Math.random(),
        x: Math.random() * window.innerWidth,
        y: Math.random() * 400 + 100,
      }));

      setOncemoreIcons(icons);
      setOncemoreClicks(0);
    } else {
      setOncemoreIcons([]);
    }
  }, [currentEvent]);
  useEffect(() => {
    if (currentEvent !== "oncemore") return;

    const stealInterval = setInterval(() => {
      setMoney((prev) => Math.max(0, prev - Math.ceil(Math.random() * 2)));
    }, 800);

    return () => clearInterval(stealInterval);
  }, [currentEvent]);

  const clickOncemoreIcon = (id: number) => {
    setOncemoreIcons((prev) => prev.filter((icon) => icon.id !== id));

    setOncemoreClicks((prev) => {
      const newCount = prev + 1;

      if (newCount >= 10) {
        setCurrentEvent(null);
        document.body.classList.remove("oncemore");
      }

      return newCount;
    });
  };

  const interactWithSheep = (id: number) => {
    setSheeps((prevSheeps) =>
      prevSheeps.map((s) => {
        if (s.id !== id) return s;

        if (shearsEquipped && !s.isBald) {
          setWoolInventory((prev) => ({
            ...prev,
            [s.type]: prev[s.type] + 1,
          }));

          const regrowSpeed = timePhase === "night" ? 23000 : 30000;

          return {
            ...s,
            image: sheepConfig[s.type].baldImage,
            isBald: true,
            regrowAt: Date.now() + regrowSpeed,
          };
        }

        if (carrotOpen && carrotCount > 0) {
          setCarrotCount((prev) => prev - 1);
          setCarrotOpen(false);
          console.log("mmmmmmmmm yummy");

          const config = sheepConfig[s.type];
          const carrotValue =
            currentEvent === "famine"
              ? Math.floor(config.carrotValue * 0.75)
              : config.carrotValue;
          return { ...s, hunger: Math.min(s.hunger + carrotValue, 100) };
        }

        if (treeOpen && treeCount > 0) {
          setTreeCount((prev) => prev - 1);
          setTreeOpen(false);

          const config = sheepConfig[s.type];
          const treeValue =
            currentEvent === "famine"
              ? Math.floor(config.treeValue * 0.75)
              : config.treeValue;
          return { ...s, hunger: Math.min(s.hunger + treeValue, 100) };
        }

        const line = getSheepLine(s);

        setTimeout(() => {
          setSheeps((curr) =>
            curr.map((sh) => (sh.id === id ? { ...sh, speech: "" } : sh)),
          );
        }, 2000);

        return { ...s, speech: line };
      }),
    );
  };

  const getSheepLine = (s: {
    id?: number;
    hunger: any;
    image?: string;
    isBald: any;
    speech?: string;
  }) => {
    if (timePhase === "night") {
      return randomFrom([
        "i cannot sleep",
        "farmer are you awake",
        "sheep leap over the fence",
        "counting stars...",
      ]);
    }
    if (currentEvent === "famine") {
      return randomFrom([
        "i hunger",
        "it is a hopeless clash",
        "farmer where is the food",
        "ts!",
      ]);
    }
    const roll = Math.random();

    if (s.hunger < 40) return randomFrom(sheepLines.hungry);
    if (s.hunger > 90) return randomFrom(sheepLines.full);
    if (s.isBald) return randomFrom(sheepLines.bald);

    if (roll < 0.02) return randomFrom(sheepLines.ominous);
    if (roll < 0.08) return randomFrom(sheepLines.funny);

    return randomFrom(sheepLines.normal);
  };

  const buyCarrots = () => {
    if (money >= 20 / rep && shopIsOpen) {
      setCarrotCount((prev) => prev + 15);
      setMoney((prev) => prev - Math.floor(20 / rep));
    }
  };

  const buyTreeLeaves = () => {
    if (money >= 35 / rep && shopIsOpen) {
      setMoney((prev) => prev - Math.floor(35 / rep));
      setTreevis("treebutton");
      setTreeCount((prev) => prev + 10);
    }
  };

  const buySheep = () => {
    if (money >= 500 && shopIsOpen) {
      setMoney((prev) => prev - 500);
      const newSheep = createSheep();
      setSheeps((prevSheeps) => [...prevSheeps, newSheep]);
    }
  };

  const openShop = () => {
    if (timePhase === "night") {
      shopIsOpen = false;
      setShop("invis");
    } else if (shopIsOpen) {
      shopIsOpen = false;
      setShop("invis");
    } else {
      shopIsOpen = true;
      setShop("vis");
    }
  };

  useEffect(() => {
    if (timePhase === "night" && shopIsOpen) {
      shopIsOpen = false;
      setShop("invis");
    }
  }, [timePhase]);

  const shiftDialogue = () => {
    setDialogueCount((prev) => prev + 1);
    const lines = [
      "im moses",
      "youre the new farmer, right?",
      "good. ill teach you the basics",
      "click carrot stack, then click a sheep.",
      "done? perfect",
      "check the shop. heres some cash.",
      "and when you get enough cash, you can buy sheep",
      "sometimes, something out of your control will happen.",
      "Just prepare for the worst",
      "watch for different-looking sheep.",
      "...",
      "I'll stick around, incase something happens",
    ];
    if (dialogueCount === 4) setMoney((prev) => prev + 150);
    if (dialogueCount >= 11) setMosesHere("invisible");
    setDialogueText(lines[dialogueCount + 1] || "");
  };

  const addLineBreaks = (str: string) => {
    const lines = str.split("\n");
    return lines.map((subStr: string, index: number) => (
      <Fragment key={index}>
        {subStr}
        {index < lines.length - 1 && <br />}
      </Fragment>
    ));
  };

  const sellWool = (type: SheepType) => {
    if (woolInventory[type] <= 0) return;
    setWoolSold((prev) => prev + 1);
    setWoolInventory((prev) => ({
      ...prev,
      [type]: prev[type] - 1,
    }));

    setMoney((prev) => prev + woolMarket[type]);
    if (type === "golden") setRep((r) => Math.min(maxRep, r + 0.01));
    if (type === "crown") setRep((r) => Math.min(maxRep, r + 0.015));
  };

  const showRenameToast = (sheepId: number) => {
    const id = Date.now();

    setToasts((prev) => [
      ...prev,
      {
        id,
        title: "Name Sheep",
        text: "Enter a name:",
        input: true,
        onSubmit: (value: string) => {
          setSheeps((prevSheeps) =>
            prevSheeps.map((s) =>
              s.id === sheepId ? { ...s, name: value.slice(0, 20) } : s,
            ),
          );

          setToasts((prev) => prev.filter((t) => t.id !== id));
        },
      },
    ]);
  };

  const feedSheep = (id: number, food: "carrot" | "tree") => {
    setSheeps((prevSheeps) =>
      prevSheeps.map((s) => {
        if (s.id !== id) return s;

        const config = sheepConfig[s.type];

        if (food === "carrot" && carrotCount > 0) {
          setCarrotCount((c) => c - 1);

          const carrotValue =
            currentEvent === "famine"
              ? Math.floor(config.carrotValue * 0.75)
              : config.carrotValue;

          return { ...s, hunger: Math.min(100, s.hunger + carrotValue) };
        }

        if (food === "tree" && treeCount > 0) {
          setTreeCount((t) => t - 1);

          const treeValue =
            currentEvent === "famine"
              ? Math.floor(config.treeValue * 0.75)
              : config.treeValue;

          return { ...s, hunger: Math.min(100, s.hunger + treeValue) };
        }

        return s;
      }),
    );
  };
  useEffect(() => {
    if (page === "catalogue") {
      const newFlavor: Record<SheepType, string> = {
        normal: randomFrom(sheepCatalogueText.normal),
        golden: randomFrom(sheepCatalogueText.golden),
        ghost: randomFrom(sheepCatalogueText.ghost),
        denis: randomFrom(sheepCatalogueText.denis),
        crown: randomFrom(sheepCatalogueText.crown),
      };

      setCatalogueFlavor(newFlavor);
    }
  }, [page]);
  if (page === "achievements") {
    return (
      <div className="achievementsPage">
        <h1 className="power">Achievements</h1>

        {achievementsList.map((a) => {
          const unlocked = achievements[a.id];

          return (
            <div
              key={a.id}
              className={`achievementEntry ${unlocked ? "unlocked" : "locked"}`}
            >
              <h3>{unlocked ? a.name : "???"}</h3>
              <p>{unlocked ? a.description : "Locked Achievement"}</p>
            </div>
          );
        })}

        <button onClick={() => setPage("game")}>Back</button>
      </div>
    );
  }
  if (page === "catalogue") {
    return (
      <div className="catalogue">
        <h1 className="power">Sheep Catalogue</h1>

        {Object.keys(sheepConfig).map((type) => {
          const t = type as SheepType;
          const discovered = discoveredSheep[t];

          return (
            <div key={t} className="catalogueEntry">
              {discovered ? (
                <>
                  <img src={sheepConfig[t].image} width={120} />
                  <p>{t} sheep</p>
                  <p>{catalogueFlavor[t]}</p>
                </>
              ) : (
                <>
                  <div className="unknownSheep">???</div>
                  <p>Unknown Sheep</p>
                </>
              )}
            </div>
          );
        })}

        <button onClick={() => setPage("game")}>Back</button>
      </div>
    );
  }

  return (
    <div className={`gameRoot ${currentEvent === "famine" ? "famine" : ""}`}>
      <div className="sheepSidebar">
        <h3>The Farm ({sheeps.length})</h3>

        {sheeps.map((s) => (
          <div key={s.id} className="sheepListEntry">
            <span className="sheepListName">{s.name}</span>
            <span className="sheepListType">({s.type})</span>

            <div className="sidebarHungerBar">
              <div
                className="sidebarHungerFill"
                style={{
                  width: `${s.hunger}%`,
                  background:
                    s.hunger > 60
                      ? "limegreen"
                      : s.hunger > 30
                        ? "gold"
                        : "red",
                }}
              />
            </div>

            <div className="sidebarButtons">
              <p>Feed</p>
              <button
                disabled={carrotCount <= 0}
                onClick={() => feedSheep(s.id, "carrot")}
              >
                Carrot
              </button>

              <button
                disabled={treeCount <= 0}
                onClick={() => feedSheep(s.id, "tree")}
              >
                Bag
              </button>

              <button onClick={() => showRenameToast(s.id)}>Rename</button>
            </div>
          </div>
        ))}
      </div>
      <p className="power">Funds: ${money}</p>
      {currentEvent === "famine" && (
        <p className="eventWarning">
          I would watch my food well, the farms have run dry ({eventTimeLeft}s)
        </p>
      )}
      {currentEvent === "coyotes" && (
        <p className="eventWarning">
          There are spooky scary Vespas hunting weak sheep, scare 'em off with
          your mouse ({eventTimeLeft}s)
        </p>
      )}
      {currentEvent === "oncemore" && (
        <p className="eventWarning">
          Once More... i'd say you should get rid of them ({oncemoreClicks}/10)
        </p>
      )}
      <div>
        <button className="buttton" onClick={carrotClick}>
          {carrotOpen ? "holding carrot" : `Carrot stack: ${carrotCount}`}
        </button>
        <br />
        <button className={treevis} onClick={treeClick}>
          {treeOpen ? "holding leaves" : `Tree Bags: ${treeCount}`}
        </button>
      </div>

      <img className={`left ${mosesHere}`} src={moses} alt="moses" />

      {coyotes.map((w) => (
        <img
          key={w.id}
          src={coyote}
          className="coyote"
          style={{
            position: "absolute",
            left: `${w.x}px`,
            top: `${w.y}px`,
            width: "120px",
            cursor: "pointer",
          }}
          onClick={() => scareCoyote(w.id)}
        />
      ))}
      {oncemoreIcons.map((icon) => (
        <img
          key={icon.id}
          src={oncemore}
          className="oncemoreIcon"
          style={{
            position: "absolute",
            left: `${icon.x}px`,
            top: `${icon.y}px`,
            width: "80px",
            cursor: "pointer",
          }}
          onClick={() => clickOncemoreIcon(icon.id)}
          alt="oncemore"
        />
      ))}

      <div
        className="sheep-container"
        style={{ display: "flex", flexWrap: "wrap", justifyContent: "center" }}
      >
        {sheeps.map((s) => (
          <div key={s.id} className="sheepWrapper">
            <p className="sheepName">{s.name}</p>
            <br />
            <div className="sheepImageContainer">
              {s.speech && <p className="sheepSpeech">{s.speech}</p>}

              <div className="hungerBar">
                <div
                  className="hungerFill"
                  style={{
                    width: `${s.hunger}%`,
                    background:
                      s.hunger > 60
                        ? "limegreen"
                        : s.hunger > 30
                          ? "gold"
                          : "red",
                  }}
                />
              </div>
            </div>
            <img
              onClick={() => interactWithSheep(s.id)}
              className="ezrasheep"
              src={s.image}
              alt="sheep"
            />
            <button onClick={() => showRenameToast(s.id)}>Rename</button>
          </div>
        ))}
      </div>

      <div>
        <button className="right" onClick={openShop}>
          Shop
        </button>
        <br />
        <br />
        <br />
        <button className={`shopping ${shop}`} onClick={buyCarrots}>
          Buy 15 Carrots (${Math.ceil(20 / rep)})
        </button>
        <br />
        <br />
        <br />
        <br />
        <button className={`shopping ${shop}`} onClick={buyTreeLeaves}>
          Buy 10 Tree Leaf Bundles (${Math.ceil(35 / rep)})
        </button>
        <br />
        <br />
        <br />
        <br />
        <button className={`shopping ${shop}`} onClick={buySheep}>
          Buy a new sheep ($500)
        </button>
      </div>

      <button
        className="shears shearsagain"
        onClick={() => setShearsEquipped(!shearsEquipped)}
      >
        {shearsEquipped ? "SHEARING" : "Shears"}
      </button>

      <div className={`dialouge ${mosesHere}`}>
        <h4 className={`dialouge ${mosesHere}`}>Moses</h4>
        <p onClick={shiftDialogue} className={`dialouge ${mosesHere}`}>
          {addLineBreaks(dialougeText)}
        </p>
      </div>
      <button
        className="otherRight"
        onClick={() => setMarketOpen((prev) => !prev)}
      >
        {marketOpen ? "Close Market" : "Wool Market"}
      </button>

      <br />
      <br />
      <br />
      <button className="otherRightAgain" onClick={() => setPage("catalogue")}>
        Catalogue
      </button>
      <br />
      <br />
      <br />
      <button
        className="otherRightAgainAgain"
        onClick={() => setPage("achievements")}
      >
        Achievements
      </button>
      {marketOpen && (
        <div className="market">
          <h3>Wool Market</h3>

          <p>Normal Wool Price: ${woolMarket.normal}</p>
          <button onClick={() => sellWool("normal")}>Sell Normal Wool</button>

          <p>Golden Wool Price: ${woolMarket.golden}</p>
          <button onClick={() => sellWool("golden")}>Sell Golden Wool</button>

          <p>Ghost Wool Price: ${woolMarket.ghost}</p>
          <button onClick={() => sellWool("ghost")}>Sell Ghost Wool</button>

          <p>Denis Wool Price: ${woolMarket.denis}</p>
          <button onClick={() => sellWool("denis")}>Sell Denis Wool</button>

          <p>Crown Wool Price: ${woolMarket.crown}</p>
          <button onClick={() => sellWool("crown")}>Sell Crown Wool</button>
        </div>
      )}

      <div className="woolPanel">
        <h3>Wool Stock</h3>
        <p>Normal: {woolInventory.normal}</p>
        <p>Golden: {woolInventory.golden}</p>
        <p>Ghost: {woolInventory.ghost}</p>
        <p>Denis: {woolInventory.denis}</p>
        <p>Crown: {woolInventory.crown}</p>
      </div>

      <button
        className="orange"
        onClick={() => {
          saveGame();
          setSaveGameUse("Saved!");
          setTimeout(() => setSaveGameUse("Save Game"), 500);
        }}
      >
        {SaveGameUse}
      </button>
      <br />
      <button
        className="orange"
        onClick={() => {
          localStorage.removeItem("ezrasheepsave");
          window.location.reload();
        }}
      >
        New Game
      </button>
      <img src={rainbpw} className="tiny"></img>
      <div className="toastContainer">
        {toasts.map((t) => (
          <div key={t.id} className="toast">
            <strong>{t.title}</strong>
            <h3>{t.text}</h3>

            {t.input && (
              <>
                <input
                  type="text"
                  maxLength={20}
                  value={toastInput}
                  onChange={(e) => setToastInput(e.target.value)}
                />
                <br />
                <button
                  onClick={() => {
                    if (t.onSubmit) t.onSubmit(toastInput);
                    setToastInput("");
                  }}
                >
                  Confirm
                </button>
              </>
            )}

            {t.moretext && <p>{t.moretext}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}
