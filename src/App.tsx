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

let shopIsOpen = false;

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
  golden: {
    image: goldenSheep,
    baldImage: baldGolden,
    woolValue: 120,
    hungerDrain: 1,
    carrotValue: 15,
    treeValue: 35,
    spawnChance: 0.03,
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
    crown: {
      image: crownSheep,
      baldImage: baldCrown,
      woolValue: 65,
      hungerDrain: 0.8,
      carrotValue: 17,
      treeValue: 38,
      spawnChance: 0.05,
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
    "i still see your shadows in my room",
    "I've had ENOUGH of this!!!",
  ],
  ominous: [
    "did moses just blink?",
    "our food is limited, farmer",
    "counting...",
    "arghhhhh im sheeping it so goooood",
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
  regrowAt?: number | null;
  nextPassiveAt?: number | null;
}

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
    };
  };

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

  const [sheeps, setSheeps] = useState<Sheep[]>([createSheep()]);

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
  const [currentEvent, setCurrentEvent] = useState<null | "famine">(null);
  const [eventTimeLeft, setEventTimeLeft] = useState(0);
  const [timeOfDay, setTimeOfDay] = useState(0);

  type TimePhase = "sunrise" | "day" | "sunset" | "night";

  const getTimePhase = (time: number): TimePhase => {
    if (time < 40) return "sunrise";
    if (time < 120) return "day";
    if (time < 160) return "sunset";
    return "night";
  };

  const timePhase = getTimePhase(timeOfDay);

  useEffect(() => {
    if (!isLoaded) return;

    const dayInterval = setInterval(() => {
      setTimeOfDay((prev) => (prev + 1) % 240);
    }, 550);

    return () => clearInterval(dayInterval);
  }, [isLoaded]);

  useEffect(() => {
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
                Math.random() * (passive.minHeal - passive.maxHeal + 1),
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
            isBald: isStillBald,
            regrowAt: isStillBald ? s.regrowAt : null,
            speech: "",
            image: isStillBald
              ? sheepConfig[type].baldImage
              : sheepConfig[type].image,
          };
        }) ?? [createSheep()],
      );

      setCarrotCount(data.carrotCount ?? 10);
      setTreeCount(data.treeCount ?? 0);
      setMoney(data.money ?? 100);
      setTreevis(data.treevis ?? "locked");
      setDialogueCount(data.dialogueCount ?? 0);
      setDialogueText(data.dialougeText ?? "im moses");
      setMosesHere(data.mosesHere ?? "visible");
      setCurrentEvent(data.currentEvent ?? null);
      setEventTimeLeft(data.eventTimeLeft ?? 0);
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (!isLoaded) return;

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

        const deadSheep = afterHunger.filter((s) => s.hunger <= 0);
        const aliveSheep = afterHunger.filter((s) => s.hunger > 0);

        if (deadSheep.length > 0) {
          const penaltyPerSheep = 175;
          setMoney((prev) =>
            Math.max(0, prev - deadSheep.length * penaltyPerSheep),
          );
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
  }, [isLoaded, currentEvent, timePhase]);

  useEffect(() => {
    if (!isLoaded) return;

    const eventRoll = setInterval(() => {
      setCurrentEvent((prev) => {
        if (prev !== null) return prev;

        if (Math.random() < 0.01) {
          setEventTimeLeft(40);
          document.body.classList.add("famine");
          return "famine";
        }

        return prev;
      });
    }, 5500);

    return () => clearInterval(eventRoll);
  }, [isLoaded]);

  useEffect(() => {
    if (!currentEvent) return;

    const timer = setInterval(() => {
      setEventTimeLeft((prev) => {
        if (prev <= 1) {
          setCurrentEvent(null);

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

  const interactWithSheep = (id: number) => {
    setSheeps((prevSheeps) =>
      prevSheeps.map((s) => {
        if (s.id !== id) return s;

        if (shearsEquipped && !s.isBald) {
          const woolValue = sheepConfig[s.type].woolValue;

          setMoney((prev) => prev + woolValue);

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
              ? Math.floor(config.carrotValue * 0.9)
              : config.carrotValue;
          return { ...s, hunger: Math.min(s.hunger + carrotValue, 100) };
        }

        if (treeOpen && treeCount > 0) {
          setTreeCount((prev) => prev - 1);
          setTreeOpen(false);

          const config = sheepConfig[s.type];
          const treeValue =
            currentEvent === "famine"
              ? Math.floor(config.treeValue * 0.9)
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
    if (money >= 20 && shopIsOpen) {
      setCarrotCount((prev) => prev + 15);
      setMoney((prev) => prev - 20);
    }
  };

  const buyTreeLeaves = () => {
    if (money >= 35 && shopIsOpen) {
      setMoney((prev) => prev - 35);
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

  return (
    <div className={`gameRoot ${currentEvent === "famine" ? "famine" : ""}`}>
      <p className="power">Funds: ${money}</p>
      {currentEvent === "famine" && (
        <p className="eventWarning">
          I would watch my food well, the farms have run dry ({eventTimeLeft}s)
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

      <div
        className="sheep-container"
        style={{ display: "flex", flexWrap: "wrap", justifyContent: "center" }}
      >
        {sheeps.map((s) => (
          <div key={s.id} className="sheepWrapper">
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
          Buy 15 Carrots (20)
        </button>
        <br />
        <br />
        <br />
        <br />
        <button className={`shopping ${shop}`} onClick={buyTreeLeaves}>
          Buy 10 Tree Leaf Bundles (35)
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
    </div>
  );
}
