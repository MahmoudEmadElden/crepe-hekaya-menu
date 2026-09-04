/**
 * قاعدة بيانات المنيو الرسمية لمطعم كريب حكاية — Crepe Hekaya
 * خالية تماماً من الرموز التعبيرية والبادجات (جديد / الأكثر طلباً)
 */

(function () {
const restaurantInfo = {
  name: "كريب حكاية",
  nameEn: "Crepe Hekaya",
  tagline: "أصل الكريب والميكسات الفاخرة على أصولها",
  description: "منيو رقمي شامل لجميع أصناف الكريب، الميكسات الخاصة، والإضافات المميزة.",
  branch: {
    name: "موقع مطعم كريب حكاية",
    address: "شارع الأزهر بجوار مطعم بهية — (شارع الرحاب أمام فريش وماركت وفر)"
  },
  workingHours: "يومياً من 12 ظهراً حتى 4 فجراً"
};

const categories = [
  { id: "all", name: "جميع الأصناف" },
  { id: "new-special", name: "قسم جديد NEW" },
  { id: "chicken", name: "كريب فراخ" },
  { id: "meat", name: "كريب لحمة" },
  { id: "mixes", name: "المكسات" },
  { id: "custom", name: "كريب على مزاجك" },
  { id: "potatoes-seafood", name: "بطاطس وسي فود" },
  { id: "sweet", name: "كريب الطاقة" },
  { id: "cheese-addons", name: "الجبن والإضافات" }
];

const menuItems = [
  // 1. قسم كريب حكاية فراخ
  {
    id: "ch-1",
    category: "chicken",
    name: "كريب بانيه",
    description: "قطع صدور دجاج بانيه متبلة ومقرمشة مع الصوص الخاص والجبن.",
    variants: { plain: 75, roumi: 80, mozzarella: 80 },
    defaultVariant: "mozzarella"
  },
  {
    id: "ch-2",
    category: "chicken",
    name: "كريب ناجتس",
    description: "قطع دجاج ناجتس الذهبية اللذيذة مع الجبن والصوصات.",
    variants: { plain: 75, roumi: 80, mozzarella: 80 },
    defaultVariant: "mozzarella"
  },
  {
    id: "ch-3",
    category: "chicken",
    name: "كريب كرسبي",
    description: "فراخ كرسبي مقرمشة طازجة مع بهارات حكاية الخاصة.",
    variants: { plain: 85, roumi: 90, mozzarella: 90 },
    defaultVariant: "mozzarella"
  },
  {
    id: "ch-4",
    category: "chicken",
    name: "كريب كتشوشا",
    description: "خلطة كتشوشا الشهيرة بقطع الفراخ المتبلة بطريقة خاصة.",
    variants: { plain: 85, roumi: 90, mozzarella: 90 },
    defaultVariant: "mozzarella"
  },
  {
    id: "ch-5",
    category: "chicken",
    name: "كريب سوبر كرانشي",
    description: "دجاج كرانشي فاخر شديد القرمشة لمحبي التميز والقرمشة العالية.",
    variants: { plain: 105, roumi: 110, mozzarella: 110 },
    defaultVariant: "mozzarella"
  },
  {
    id: "ch-6",
    category: "chicken",
    name: "كريب استربس",
    description: "أصابع استربس صدور دجاج صافية ومقرمشة على أصولها.",
    variants: { plain: 105, roumi: 110, mozzarella: 110 },
    defaultVariant: "mozzarella"
  },
  {
    id: "ch-7",
    category: "chicken",
    name: "كريب زنجر",
    description: "قطع زنجر حارة ومقرمشة مع لمسة سبايسي لا تقاوم.",
    variants: { plain: 105, roumi: 110, mozzarella: 110 },
    defaultVariant: "mozzarella"
  },
  {
    id: "ch-8",
    category: "chicken",
    name: "كريب كوردن بلو",
    description: "رولات كوردن بلو المحشوة بالجبن واللحم المدخن الذهبي المقرمش.",
    variants: { plain: 105, roumi: 110, mozzarella: 110 },
    defaultVariant: "mozzarella"
  },
  {
    id: "ch-9",
    category: "chicken",
    name: "كريب شاورما فراخ",
    description: "شاورما دجاج متبلة على الطريقة الشرقية الغنية بالنكهة.",
    variants: { plain: 110, roumi: 115, mozzarella: 115 },
    defaultVariant: "mozzarella"
  },
  {
    id: "ch-10",
    category: "chicken",
    name: "كريب فاهيتا فراخ",
    description: "شرائح دجاج فاهيتا متبلة مع الفلفل الألوان والبصل والصوص المميز.",
    variants: { plain: 110, roumi: 115, mozzarella: 115 },
    defaultVariant: "mozzarella"
  },
  {
    id: "ch-11",
    category: "chicken",
    name: "كريب شيش طاووق",
    description: "أوراك دجاج شيش مشوية ومتبلة بتتبيلة حكاية الغنية والمميزة.",
    variants: { plain: 110, roumi: 115, mozzarella: 115 },
    defaultVariant: "mozzarella"
  },

  // 2. قسم كريب حكاية لحمة
  {
    id: "mt-1",
    category: "meat",
    name: "كريب سوسيس",
    description: "أصابع سوسيس عالية الجودة مشوحة مع خلطة الجبن والتوابل.",
    variants: { plain: 90, roumi: 95, mozzarella: 95 },
    defaultVariant: "mozzarella"
  },
  {
    id: "mt-2",
    category: "meat",
    name: "كريب هوت دوج",
    description: "هوت دوج مشوي بطعم كلاسيكي رائع مع الخضار والجبن.",
    variants: { plain: 90, roumi: 95, mozzarella: 95 },
    defaultVariant: "mozzarella"
  },
  {
    id: "mt-3",
    category: "meat",
    name: "كريب برجر",
    description: "برجر لحم بلدي متبل ومشوي على الجريل مع الجبن الذائب.",
    variants: { plain: 90, roumi: 95, mozzarella: 95 },
    defaultVariant: "mozzarella"
  },
  {
    id: "mt-4",
    category: "meat",
    name: "كريب كفتة",
    description: "أصابع كفتة لحم مشوية بتتبيلة شرقية غنية وأصلية.",
    variants: { plain: 90, roumi: 95, mozzarella: 95 },
    defaultVariant: "mozzarella"
  },
  {
    id: "mt-5",
    category: "meat",
    name: "كريب سجق",
    description: "سجق شرقي بلدي متبل بالخلطة الإسكندراني الحارة اللذيذة.",
    variants: { plain: 95, roumi: 100, mozzarella: 100 },
    defaultVariant: "mozzarella"
  },

  // 3. قسم المكسات
  {
    id: "mx-1",
    category: "mixes",
    name: "بانيه على سوسيس",
    description: "مزيج شهي من دجاج البانيه المقرمش مع قطع السوسيس اللذيذة.",
    variants: { plain: 80, roumi: 85, mozzarella: 85 },
    defaultVariant: "mozzarella"
  },
  {
    id: "mx-2",
    category: "mixes",
    name: "بانيه على كفتة",
    description: "مكس يجمع بين قرمشة البانيه ونكهة الكفتة الشرقية المشوية.",
    variants: { plain: 80, roumi: 85, mozzarella: 85 },
    defaultVariant: "mozzarella"
  },
  {
    id: "mx-3",
    category: "mixes",
    name: "بانيه على برجر",
    description: "ثنائي القوة من دجاج البانيه الذهبي وبرجر اللحم الغني.",
    variants: { plain: 80, roumi: 85, mozzarella: 85 },
    defaultVariant: "mozzarella"
  },
  {
    id: "mx-4",
    category: "mixes",
    name: "بانيه على سجق",
    description: "بانيه مقرمش مع سجق إسكندراني متبل بالنكهات الغنية.",
    variants: { plain: 80, roumi: 85, mozzarella: 85 },
    defaultVariant: "mozzarella"
  },
  {
    id: "mx-5",
    category: "mixes",
    name: "كرسبي على سوسيس",
    description: "دجاج كرسبي سوبر مقرمش مع أصابع السوسيس المشوحة.",
    variants: { plain: 85, roumi: 90, mozzarella: 90 },
    defaultVariant: "mozzarella"
  },
  {
    id: "mx-6",
    category: "mixes",
    name: "كرسبي على كفتة",
    description: "كرسبي ذهبي مقرمش مع كفتة لحم مشوية بالتوابل.",
    variants: { plain: 85, roumi: 90, mozzarella: 90 },
    defaultVariant: "mozzarella"
  },
  {
    id: "mx-7",
    category: "mixes",
    name: "كرسبي على برجر",
    description: "مكس دجاج كرسبي مع شريحة برجر لحم مشوية وجبن ذائب.",
    variants: { plain: 85, roumi: 90, mozzarella: 90 },
    defaultVariant: "mozzarella"
  },
  {
    id: "mx-8",
    category: "mixes",
    name: "كرسبي على سجق",
    description: "كرسبي مقرمش مع سجق بلدي شرقي بالخلطة الخاصة.",
    variants: { plain: 85, roumi: 90, mozzarella: 90 },
    defaultVariant: "mozzarella"
  },
  {
    id: "mx-9",
    category: "mixes",
    name: "شيش على استربس",
    description: "أقوى مكس دجاج فاخر: قطع شيش طاووق مع أصابع استربس صدور دجاج.",
    variants: { plain: 130, roumi: 135, mozzarella: 135 },
    defaultVariant: "mozzarella"
  },
  {
    id: "mx-10",
    category: "mixes",
    name: "شاورما على كوردن",
    description: "مزيج فاخر ومميز يجمع بين شاورما الدجاج والكوردن بلو المقرمش.",
    variants: { plain: 130, roumi: 135, mozzarella: 135 },
    defaultVariant: "mozzarella"
  },
  {
    id: "mx-11",
    category: "mixes",
    name: "شاورما على استربس",
    description: "شاورما دجاج متبلة مع أصابع استربس دجاج مقرمشة.",
    variants: { plain: 130, roumi: 135, mozzarella: 135 },
    defaultVariant: "mozzarella"
  },
  {
    id: "mx-12",
    category: "mixes",
    name: "كرسبي على استربس",
    description: "عشاق القرمشة: مكس دجاج كرسبي مع أصابع استربس غنية.",
    variants: { plain: 100, roumi: 110, mozzarella: 110 },
    defaultVariant: "mozzarella"
  },
  {
    id: "mx-13",
    category: "mixes",
    name: "بطاطس على بانيه",
    description: "بطاطس مقلية ذهبية مع قطع دجاج بانيه وصوصات شهية.",
    variants: { plain: 85, roumi: 90, mozzarella: 90 },
    defaultVariant: "mozzarella"
  },
  {
    id: "mx-14",
    category: "mixes",
    name: "ميكس فراخ",
    description: "تشكيلة دجاج حكاية الكاملة: (بانيه - كرسبي - استربس) مع الجبن والصلصات.",
    variants: { plain: 100, roumi: 110, mozzarella: 110 },
    defaultVariant: "mozzarella"
  },
  {
    id: "mx-15",
    category: "mixes",
    name: "ميكس لحمة",
    description: "تشكيلة اللحوم المشوية: (كفتة - برجر - هوت دوج) الغنية بالنكهات.",
    variants: { plain: 100, roumi: 110, mozzarella: 110 },
    defaultVariant: "mozzarella"
  },
  {
    id: "mx-16",
    category: "mixes",
    name: "كوكتيل حكاية",
    description: "المكس الشامل الأقوى: (بانيه - كرسبي - كفتة - برجر) لوجبة مشبعة وفاخرة.",
    variants: { plain: 100, roumi: 110, mozzarella: 110 },
    defaultVariant: "mozzarella"
  },

  // 4. قسم جديد NEW
  {
    id: "nw-1",
    category: "new-special",
    name: "كريب زون",
    description: "المكونات: كوردن بلو، زنجر حار، تركي مدخن، خضار فريش، جبنة موزاريلا غنية، وصوص شيدر كريمي ذائب.",
    ingredients: ["كوردن بلو", "زنجر", "تركي مدخن", "خضار", "موزاريلا", "صوص شيدر"],
    price: 130
  },
  {
    id: "nw-2",
    category: "new-special",
    name: "كريب كيمبو",
    description: "المكونات: سوبر كرانشي مقرمش، كوردن بلو، بطاطس مقلية، خس طازج، صوص شيدر غني، وجبنة موزاريلا مطاطية.",
    ingredients: ["سوبر كرانشي", "كوردن بلو", "بطاطس", "خس", "صوص شيدر", "موزاريلا"],
    price: 130
  },
  {
    id: "nw-3",
    category: "new-special",
    name: "كريب تربو",
    description: "المكونات: دجاج كرانشي، سوسيس مشوح، بطاطس ذهبية، خس مقرمش، صوص خاص، جبنة موزاريلا، وشيدر.",
    ingredients: ["كرانشي", "سوسيس", "بطاطس", "خس", "صوص حكاية", "موزاريلا", "شيدر"],
    price: 120
  },
  {
    id: "nw-4",
    category: "new-special",
    name: "كريب دياموند",
    description: "المكونات: بانيه كرسبي ذهبي، أصابع استربس دجاج، سوسيس، خس، صوص سري، جبنة موزاريلا وشيدر.",
    ingredients: ["بانيه كرسبي", "استربس", "سوسيس", "خس", "صوص", "موزاريلا", "شيدر"],
    price: 125
  },
  {
    id: "nw-5",
    category: "new-special",
    name: "كريب جوكر",
    description: "المكونات: فراخ فرايد، قطع تشيكن متبلة، بطاطس، خس طازج، صوصات مميزة، جبن شيدر وموزاريلا.",
    ingredients: ["فراخ فرايد", "تشيكن", "بطاطس", "خس", "صوص", "شيدر", "موزاريلا"],
    price: 115
  },
  {
    id: "nw-6",
    category: "new-special",
    name: "كريب تشكن رانش",
    description: "المكونات: دجاج كرسبي، كرانشي، بطاطس مقلية، جبنة موزاريلا، فلفل ألوان، طماطم فريش، وصوص رانش غني منعش.",
    ingredients: ["كرسبي", "كرانشي", "بطاطس", "موزاريلا", "فلفل", "طماطم", "صوص رانش"],
    price: 120
  },
  {
    id: "nw-7",
    category: "new-special",
    name: "كريب فرايد تشكن",
    description: "المكونات: صدور فراخ فرايد حار أو بارد حسب الرغبة، جبنة موزاريلا، صوص شيدر، وخضار فريش.",
    ingredients: ["صدور فراخ حار/بارد", "موزاريلا", "صوص شيدر", "خضار"],
    price: 120
  },
  {
    id: "nw-8",
    category: "new-special",
    name: "كريب تشيز بوم",
    description: "المكونات: دجاج كرانشي، كوردن بلو، أصابع موزاريلا مقلية مقرمشة، تركي مدخن، موزاريلا إكسترا، صوص شيدر، وخس.",
    ingredients: ["كرانشي", "كوردن بلو", "أصابع موزاريلا", "تركي مدخن", "موزاريلا إكسترا", "صوص شيدر", "خس"],
    price: 140
  },

  // 5. قسم كريب على مزاجك
  {
    id: "cst-1",
    category: "custom",
    name: "كريب الوحش",
    description: "المكونات: بانيه، كرسبي مقرمش، كتيوشا، وهوت دوج مع الجبن والصوصات.",
    ingredients: ["بانيه", "كرسبي", "كتيوشا", "هوت دوج"],
    variants: { plain: 95, roumi: 100, mozzarella: 100 },
    defaultVariant: "mozzarella"
  },
  {
    id: "cst-2",
    category: "custom",
    name: "كريب الصاروخ",
    description: "المكونات: بانيه، كرسبي، كتيوشا، هوت دوج، كفتة مشوية، برجر لحم، وبطاطس مقلية.",
    ingredients: ["بانيه", "كرسبي", "كتيوشا", "هوت دوج", "كفتة", "برجر", "بطاطس"],
    variants: { plain: 115, roumi: 120, mozzarella: 120 },
    defaultVariant: "mozzarella"
  },
  {
    id: "cst-3",
    category: "custom",
    name: "كريب حبيشة",
    description: "المكونات: بانيه، كرسبي، كتيوشا، استربس دجاج، شيش طاووق، وبطاطس مقلية.",
    ingredients: ["بانيه", "كرسبي", "كتيوشا", "استربس", "شيش", "بطاطس"],
    variants: { plain: 125, roumi: 130, mozzarella: 130 },
    defaultVariant: "mozzarella"
  },
  {
    id: "cst-4",
    category: "custom",
    name: "كريب ميكس إسبايسي",
    description: "المكونات الحارة: كرسبي مقرمش، كتيوشا متبلة، وأصابع استربس سبايسي.",
    ingredients: ["كرسبي حار", "كتيوشا", "استربس إسبايسي"],
    variants: { plain: 100, roumi: 110, mozzarella: 110 },
    defaultVariant: "mozzarella"
  },
  {
    id: "cst-5",
    category: "custom",
    name: "كريب كوكو الضعيف",
    description: "المكونات الخفيفة المحبوبة: قطع بانيه مع دجاج ناجتس الذهبي اللذيذ.",
    ingredients: ["بانيه", "ناجتس"],
    variants: { plain: 80, roumi: 85, mozzarella: 85 },
    defaultVariant: "mozzarella"
  },
  {
    id: "cst-6",
    category: "custom",
    name: "كريب المافيا",
    description: "المكونات الفاخرة: بانيه، كرسبي، شيش طاووق، إستربس، وكوردن بلو.",
    ingredients: ["بانيه", "كرسبي", "شيش", "إستربس", "كوردن بلو"],
    variants: { plain: 140, roumi: 145, mozzarella: 145 },
    defaultVariant: "mozzarella"
  },
  {
    id: "cst-7",
    category: "custom",
    name: "كريب الملكة",
    description: "الملكي الأضخم: بانيه، كرسبي، كتيوشا، استربس، شيش، هوت دوج، برجر، كفتة، وبطاطس.",
    ingredients: ["بانيه", "كرسبي", "كتيوشا", "استربس", "شيش", "هوت دوج", "برجر", "كفتة", "بطاطس"],
    variants: { plain: 145, roumi: 150, mozzarella: 150 },
    defaultVariant: "mozzarella"
  },
  {
    id: "cst-8",
    category: "custom",
    name: "كريب المزاج",
    description: "المكونات الفاخرة: كوردن بلو، إستربس دجاج، شيش طاووق، جبنة موزاريلا، وخضار فريش.",
    ingredients: ["كوردن بلو", "إستربس", "شيش", "موزاريلا", "خضار"],
    variants: { plain: 140, roumi: 145, mozzarella: 145 },
    defaultVariant: "mozzarella"
  },

  // 6. قسم بطاطس وسي فود
  {
    id: "pot-1",
    category: "potatoes-seafood",
    name: "كريب بطاطس",
    description: "بطاطس مقلية ذهبية مقرمشة مع الجبن والتوابل الشهية.",
    variants: { plain: 55, roumi: 60, mozzarella: 60 },
    defaultVariant: "mozzarella"
  },
  {
    id: "pot-2",
    category: "potatoes-seafood",
    name: "باكت بطاطس فارم فريتس",
    description: "بطاطس مقلية مقرمشة سريعة.",
    isFixedVariant: true,
    sizeOptions: [
      { name: "صغير", price: 20 },
      { name: "كبير", price: 25 }
    ],
    price: 20
  },
  {
    id: "sea-1",
    category: "potatoes-seafood",
    name: "كريب تونة قطع",
    description: "قطع تونة فاخرة مع الخضار الطازج والجبن والصوص المميز.",
    variants: { plain: 95, roumi: 100, mozzarella: 100 },
    defaultVariant: "mozzarella"
  },

  // 7. قسم كريب الطاقة
  {
    id: "sw-1",
    category: "sweet",
    name: "كريب نوتيلا سادة",
    description: "عجينة كريب طازجة مغطاة بشوكولاتة النوتيلا الأصلية الغنية.",
    price: 65
  },
  {
    id: "sw-2",
    category: "sweet",
    name: "كريب نوتيلا بالموز",
    description: "شوكولاتة نوتيلا أصلية محشوة بشرائح الموز الطازج وصوص الشوكولاتة.",
    price: 70
  },
  {
    id: "sw-3",
    category: "sweet",
    name: "كريب نوتيلا أوريو",
    description: "نوتيلا غنية مع قطع بسكويت الأوريو المقرمش وصوص الكاكاو.",
    price: 70
  },

  // 8. ركن الجبن والإضافات
  {
    id: "chz-1",
    category: "cheese-addons",
    name: "كريب جبنة موزاريلا",
    description: "كريب محشو بجبنة موزاريلا طبيعية مطاطية.",
    options: [
      { name: "سادة", price: 70 },
      { name: "مع خضار فريش", price: 75 }
    ],
    price: 70
  },
  {
    id: "chz-2",
    category: "cheese-addons",
    name: "كريب جبنة رومي",
    description: "كريب محشو بجبنة رومي قديمة غنية النكهة والمذاق.",
    options: [
      { name: "سادة", price: 70 },
      { name: "مع خضار فريش", price: 75 }
    ],
    price: 70
  },
  {
    id: "chz-3",
    category: "cheese-addons",
    name: "كريب ميكس جبن",
    description: "مزيج فاخر من (جبنة موزاريلا - جبنة رومي - جبنة شيدر).",
    options: [
      { name: "سادة", price: 75 },
      { name: "مع خضار فريش", price: 80 }
    ],
    price: 75
  }
];

const extraAddons = [
  { name: "إضافة بطاطس مقلية", price: 10 },
  { name: "إضافة صوص شيدر كريمي", price: 15 },
  { name: "إضافة صوص رانش فاخر", price: 15 },
  { name: "إضافة صوص باربيكيو مدخن", price: 10 },
  { name: "إضافة جبنة موزاريلا إكسترا", price: 15 },
  { name: "إضافة جبنة رومي إكسترا", price: 15 },
  { name: "إضافة لحمة أو فراخ", price: 25 },
  { name: "إضافة شيش أو استربس أو كوردن بلو", price: 30 },
  { name: "إضافة بانيه أو كرسبي مقرمش", price: 15 },
  { name: "إضافة كانز ماكس كولا", price: 15 },
  { name: "إضافة كونو مقرمش", price: 20 }
];

const galleryPhotos = [
  "assets/images/gallery/photo-9.jpeg",
  "assets/images/gallery/photo-10.jpeg",
  "assets/images/gallery/photo-6.jpeg",
  "assets/images/gallery/photo-5.jpeg",
  "assets/images/gallery/photo-4.jpeg",
  "assets/images/gallery/photo-2.jpeg",
  "assets/images/gallery/photo-1.jpeg",
  "assets/images/gallery/photo-monument.jpeg"
];

if (typeof window !== 'undefined') {
  window.CrepeHekayaData = {
    restaurantInfo,
    categories,
    menuItems,
    extraAddons,
    galleryPhotos
  };
}
})();
