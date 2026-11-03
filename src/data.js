export const brand = {
  name: "MODUS-EDGE",
  email: "modusedgezw@gmail.com",
  address: "821 Ferguson Avenue, Greendale",
  phones: ["+263716055533", "+263783055893"],
  whatsapp: "263786209200",
  whatsappDisplay: "0786209200",
};

export function money(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(value);
}

export const shopFilters = [
  { id: "all", label: "All products" },
  { id: "shirts", label: "Golf shirts" },
  { id: "headwear", label: "Hats and caps" },
  { id: "gear", label: "Bags and gear" },
  { id: "gifts", label: "Novelty gifts" },
];

export const products = [
  {
    id: "tour-soft",
    name: "Tour Soft Golf Balls",
    group: "gifts",
    price: 42,
    compareAt: 54,
    badge: "Bestseller",
    featured: true,
    image: "/images/ball.jpg",
    blurb: "Urethane cover, mid compression, and a flight that stays down when the wind is up.",
    details:
      "A 12-ball pack for players who want the ball to check on full wedges without giving up speed off the driver. The cover stays soft around the green, and the core keeps its pace on the mishits you actually hit.",
    highlights: ["12-ball pack", "Urethane cover", "Mid compression"],
    specs: [
      ["Cover", "Urethane"],
      ["Pieces", "3"],
      ["Compression", "Mid"],
      ["Pack", "12 balls"],
    ],
  },
  {
    id: "iron",
    name: "Players 7-Iron",
    group: "gear",
    price: 189,
    compareAt: 240,
    badge: "Sale",
    featured: true,
    image: "/images/clubs.jpg",
    blurb: "A player's 7-iron with a top line you can aim and a sole that still forgives the heavy one.",
    details:
      "Shaped for golfers who want to see a thin top line and still get the ball in the air. The sole keeps the leading edge from digging, so a slightly heavy strike still finds the green.",
    highlights: ["Player shaping", "Forgiving sole", "Mid trajectory"],
    specs: [
      ["Club", "7-iron"],
      ["Lie", "Standard"],
      ["Finish", "Satin"],
      ["Grip", "Standard"],
    ],
  },
  {
    id: "driver",
    name: "Tour Driver 10.5°",
    group: "gear",
    price: 429,
    compareAt: 499,
    badge: "New",
    featured: false,
    image: "/images/player.jpg",
    blurb: "10.5 degrees of easy launch, with a face that holds speed when you miss the middle.",
    details:
      "Built for a rising flight that still runs out. The 10.5° head is the setting most golfers should start with, and the face keeps ball speed honest on strikes toward the toe.",
    highlights: ["10.5° loft", "Easy launch", "Standard length"],
    specs: [
      ["Loft", "10.5°"],
      ["Hand", "Right"],
      ["Shaft", "Regular or stiff"],
      ["Head", "460cc"],
    ],
  },
  {
    id: "putter",
    name: "Blade Putter",
    group: "gear",
    price: 219,
    compareAt: 260,
    badge: "Sale",
    featured: false,
    image: "/images/flag.jpg",
    blurb: "A slim blade with a soft insert and a neck that suits a slight arc.",
    details:
      "For golfers who like to see the face and swing the putter on a small arc. The insert takes the click off center strikes and keeps the start line quiet.",
    highlights: ["Soft insert", "Slight-arc neck", "Heel-toe balance"],
    specs: [
      ["Style", "Blade"],
      ["Length", '34"'],
      ["Toe hang", "Moderate"],
      ["Grip", "Pistol"],
    ],
  },
  {
    id: "cart",
    name: "Fairway Course Cart",
    group: "gear",
    price: 849,
    compareAt: 999,
    badge: "Limited",
    featured: true,
    image: "/images/cart1.jpg",
    blurb: "Room for two bags, a cooler, and the long way around the water.",
    details:
      "A course cart for the round you want to ride. Two bag wells, a seat that stays dry after a morning sprinkler, and enough space for the extras that usually end up on the floor.",
    highlights: ["Two bag wells", "Day-long seat", "Cooler space"],
    specs: [
      ["Seats", "2"],
      ["Bags", "2"],
      ["Use", "Course"],
      ["Color", "Sand"],
    ],
  },
  {
    id: "carry",
    name: "Links Carry Bag",
    group: "gear",
    price: 264,
    compareAt: 384,
    badge: "Sale",
    featured: true,
    image: "/images/fairway.jpg",
    blurb: "A carry bag that stands on the tee and still straps into the cart when you ride.",
    details:
      "Light enough for a walking loop, with a base that stands up while you pull a club. Full-length dividers keep the grips from chattering, and the pocket layout is simple on purpose.",
    highlights: ["Stand base", "Full dividers", "Cart strap"],
    specs: [
      ["Style", "Stand"],
      ["Dividers", "4-way"],
      ["Pockets", "5"],
      ["Weight", "Light"],
    ],
  },
  {
    id: "glove",
    name: "Cabretta Tour Glove",
    group: "gifts",
    price: 28,
    compareAt: null,
    badge: null,
    featured: false,
    image: "/images/glove.jpg",
    blurb: "Cabretta palm, a breathable back, and a closure that stays put for 18 holes.",
    details:
      "A glove you forget you are wearing. The palm stays tacky into the back nine, and the tab closes without the velcro giving up halfway through the round.",
    highlights: ["Cabretta palm", "Breathable back", "Left hand"],
    specs: [
      ["Hand", "Left"],
      ["Material", "Cabretta"],
      ["Closure", "Tab"],
      ["Sizes", "S–XL"],
    ],
  },
  {
    id: "polo",
    name: "Lime Fairway Polo",
    group: "shirts",
    line: "premium",
    price: 78,
    compareAt: 96,
    badge: "Sale",
    featured: true,
    image: "/images/swing.jpg",
    blurb: "A light polo that moves with the swing and still looks right at the turn.",
    details:
      "Cut with room through the shoulders so the shirt doesn't fight the backswing. The fabric dries between holes and keeps its color after a hot afternoon.",
    highlights: ["Swing ease", "Quick dry", "Four-way stretch"],
    specs: [
      ["Fit", "Athletic"],
      ["Fabric", "Stretch knit"],
      ["Sizes", "S–XXL"],
      ["Care", "Machine wash"],
    ],
  },
  {
    id: "navy",
    name: "Navy Course Polo",
    group: "shirts",
    line: "premium",
    price: 82,
    compareAt: null,
    badge: null,
    featured: false,
    image: "/images/putt.jpg",
    blurb: "A course polo cut to move, in a navy that hides a little bunker sand.",
    details:
      "The same swing-friendly cut as the lime polo, in a color you can wear to the grill after the round. Collar stays down. Hem stays put.",
    highlights: ["Course navy", "Stay-put collar", "Athletic fit"],
    specs: [
      ["Fit", "Athletic"],
      ["Color", "Navy"],
      ["Sizes", "S–XXL"],
      ["Care", "Machine wash"],
    ],
  },
  {
    id: "cap",
    name: "Fairway Trucker Cap",
    group: "headwear",
    price: 34,
    compareAt: 42,
    badge: "Sale",
    featured: true,
    image: "/images/cap.jpg",
    blurb: "A structured cap with a brim that stays put from the first tee to the last green.",
    details:
      "Mesh back for warm rounds, a brim with enough starch to keep the sun out of your eyes, and a crown that doesn't collapse in a golf bag.",
    highlights: ["Mesh back", "Structured crown", "One size"],
    specs: [
      ["Style", "Trucker"],
      ["Closure", "Snap"],
      ["Color", "White"],
      ["Size", "Adjustable"],
    ],
  },
  {
    id: "crew",
    name: "Performance Crew",
    group: "shirts",
    line: "activ",
    price: 48,
    compareAt: 62,
    badge: "Sale",
    featured: false,
    image: "/images/polo.jpg",
    blurb: "A smooth crew for warm-up swings and long days on the range.",
    details:
      "Plain on purpose. Soft against the shoulders, light enough for summer range sessions, and cut so it doesn't grab when you turn through the ball.",
    highlights: ["Light knit", "Range days", "Clean neckline"],
    specs: [
      ["Style", "Crew"],
      ["Fit", "Regular"],
      ["Sizes", "S–XXL"],
      ["Care", "Machine wash"],
    ],
  },
];

export const stories = [
  {
    id: "performance",
    label: "Pro-Level Performance",
    quote:
      "Too many golf balls, but these deliver unmatched distance, precision, and control. Highly recommended. My short game has never been better, and the soft feel makes every shot effortless.",
    name: "Arvin Khan",
    role: "Pro Golfer",
    avatar: "/images/portrait.jpg",
  },
  {
    id: "game",
    label: "Game-Improving",
    quote:
      "The 7-iron is the first club that doesn't punish a thin one. I stopped aiming away from the flag and started trusting the number on the sprinkler head.",
    name: "Lena Ortiz",
    role: "Teaching Pro",
  },
  {
    id: "quality",
    label: "Premium Quality",
    quote:
      "The polo still looks right after 18 holes in the heat, and the glove doesn't go stiff halfway through the round. That is the whole review.",
    name: "Chris Adler",
    role: "Member",
  },
  {
    id: "spin",
    label: "Superior Spin",
    quote:
      "Full wedges check up instead of releasing through the green. That one change took two putts off the card I usually sign.",
    name: "Noah Park",
    role: "Club Fitter",
  },
];

export const collections = [
  {
    title: "Golf shirts",
    text: "Premium polos and an activ crew for the round and the range.",
    to: "/shop?cat=shirts",
    image: "/images/swing.jpg",
    wide: true,
  },
  {
    title: "Hats and caps",
    text: "A structured cap that stays put from the first tee.",
    to: "/shop?cat=headwear",
    image: "/images/cap.jpg",
  },
  {
    title: "Novelty gifts",
    text: "Balls and a glove that work as a clubhouse gift.",
    to: "/shop?cat=gifts",
    image: "/images/ball.jpg",
  },
  {
    title: "Bags and gear",
    text: "Clubs, a carry bag, and a cart for the long loop.",
    to: "/shop?cat=gear",
    image: "/images/cart1.jpg",
  },
];

export const partners = [
  "Ridge Club",
  "Northwind",
  "Cedar Links",
  "Pineside",
  "Alto Range",
  "Fairway Desk",
  "Greenroom",
  "Harare Loop",
];

export const posts = [
  {
    slug: "fit-your-ball",
    kicker: "Ball lab",
    date: "October 12, 2026",
    title: "Fit the ball to the swing you have",
    excerpt: "Compression, cover, and a simple range test that tells you more than the box does.",
    image: "/images/ball.jpg",
    body: [
      "Start with swing speed, not with the word tour. A firmer ball can feel fast and still cost you height if you don't load it. A softer ball can feel kind and still wander if the cover is the only thing the marketing talks about.",
      "On the range, hit six drives with the ball you play and six with the one you are testing. Watch the window, not the monitor first. Then hit six full wedges to the same number and see which one stops where you can putt.",
      "Keep the winner for a month. One great range session is a hint. A month of tee shots into the wind is an answer. If the short game gets quieter and the tee ball doesn't give anything back, that is your ball.",
    ],
  },
  {
    slug: "short-game",
    kicker: "Practice",
    date: "September 2, 2026",
    title: "Five quiet fixes for the short game",
    excerpt: "Grip, landing spot, one club, a smaller target, and a routine you can remember.",
    image: "/images/clubs.jpg",
    body: [
      "Soften the grip before you change the swing. Most chunked chips start with hands that are already tight. Hold the club like a glass you don't want to drop, then make a swing short enough that the hands stay quiet.",
      "Pick the landing spot, not the hole. A ball that lands on the right piece of green uses the slope you already walked. Chasing the flag with a flop, when a bump will do, is how three-putts begin.",
      "Play one club around the green for a week. Learn three swings with a gap wedge: a putt-like stroke, a hip-high chip, and a fuller pitch. When those three have a size you can predict, add another club.",
      "Make the practice target smaller than the hole you hope for. A towel at ten feet is a better teacher than a basket of balls aimed at the whole green.",
      "Keep the routine boring. Same look, same grip, same breath. The shot can change. The start of it should not.",
    ],
  },
  {
    slug: "member-notes",
    kicker: "Membership",
    date: "August 18, 2026",
    title: "What members see before the rest of the shop",
    excerpt: "Early access, fitting notes, and the difference between Player and Tour.",
    image: "/images/fairway.jpg",
    body: [
      "Members hear about a limited run before it hits the public grid. That is the practical part: a day to order the polo size that disappears, or the ball pack before the shelf is thin.",
      "Player is the everyday plan. A standing discount, early notes, and free shipping once the bag clears the line. Tour adds a yearly fitting block so the clubs in the bag match the swing you have this season, not the one from three years ago.",
      "This shop is a demo, so joining here doesn't bill a card. The plans are laid out the way a real fitting desk would explain them: what you get, what it costs, and who it is for.",
    ],
  },
];

export const studios = [
  { city: "Austin", hours: "Thu–Sun, 8am–6pm" },
  { city: "Chicago", hours: "Fri–Mon, 8am–6pm" },
  { city: "Scottsdale", hours: "Thu–Sun, 7am–5pm" },
];
