/**
 * Hesham Fouad — King of Crepe (هشام فؤاد — ملك الكريب)
 * Authentic Menu Data — Clean Pro Version (No Emojis)
 */
(function () {
  'use strict';

  const restaurantInfo = {
    name: 'هشام فؤاد',
    subtitle: 'ملك الكريب',
    slogan: 'أجود كريب في أسيوط معمول بحب وعناية لتستمتع بأفضل تجربة طعام.',
    address: 'أسيوط — شارع المحافظة بجوار الفانوس أمام مستشفى طيبة',
    locationShort: 'أسيوط، شارع المحافظة',
    phones: ['01554006656', '01038945555'],
    primaryPhone: '01554006656',
    secondaryPhone: '01038945555',
    whatsapp: '201554006656',
    discountNote: 'الأسعار تشمل خصم 15% طوال فترة الافتتاح',
    openingHours: 'يومياً من 12:00 ظهراً حتى 3:00 فجراً',
    deliveryFee: 15,
    minOrder: 50,
  };

  const categories = [
    { id: 'signature', name: 'الميكسات والوحش', icon: 'fa-crown', badge: 'الأكثر طلباً' },
    { id: 'chicken', name: 'كريب الدجاج', icon: 'fa-drumstick-bite', badge: 'مقرمش ومشوي' },
    { id: 'meat', name: 'كريب اللحوم', icon: 'fa-bacon', badge: 'بلدي ومدخن' },
    { id: 'fries', name: 'البطاطس والجبن', icon: 'fa-cheese', badge: 'غرقان صوصات' },
    { id: 'sweet', name: 'كريب حلو', icon: 'fa-cookie-bite', badge: 'بستري ومكسرات' },
    { id: 'sauces', name: 'الصوصات والإكسترا', icon: 'fa-pepper-hot', badge: 'إضافات مميزة' }
  ];

  const extraAddons = [
    { id: 'extra-romi', name: 'جبنة رومي مبشورة', price: 20 },
    { id: 'extra-mozzarella', name: 'موتزاريلا سايحة إكسترا', price: 20 },
    { id: 'extra-mix-cheese', name: 'ميكس جبن (شيدر + رومي + موتزاريلا)', price: 20 },
    { id: 'extra-fries', name: 'بطاطس مقرمشة', price: 20 },
    { id: 'extra-jalapeno', name: 'هالابينو حار', price: 20 },
    { id: 'extra-crepe-bread', name: 'فطيرة كريب إضافية', price: 25 }
  ];

  const extraSauces = [
    { id: 'sauce-ranch', name: 'صوص رانش فاخر', price: 25 },
    { id: 'sauce-cheddar', name: 'صوص شيدر سايح', price: 25 },
    { id: 'sauce-thousand-island', name: 'صوص ألف جزيرة', price: 20 },
    { id: 'sauce-bbq', name: 'صوص باربكيو مدخن', price: 20 },
    { id: 'sauce-sweet-chili', name: 'سويت تشيلي', price: 20 },
    { id: 'sauce-cocktail', name: 'صوص كوكتيل ميكس', price: 20 },
    { id: 'sauce-big-tasty', name: 'صوص بيج تايستي الشهير', price: 20 },
    { id: 'sauce-harissa', name: 'هريسة شطة حارة', price: 20 }
  ];

  const sweetSauces = [
    { id: 'sweet-nutella', name: 'صوص نوتيلا أصلي', price: 30 },
    { id: 'sweet-kinder', name: 'صوص كيندر شوكلت', price: 30 },
    { id: 'sweet-pistachio', name: 'صوص بستاشيو فاخر', price: 30 },
    { id: 'sweet-lotus', name: 'صوص لوتس بالبسكوت', price: 30 },
    { id: 'sweet-white-choc', name: 'صوص وايت شوكلت بلجيكي', price: 30 },
    { id: 'sweet-jam', name: 'صوص مربى (فراولة / تين)', price: 25 }
  ];

  const menuItems = [
    // 1. SIGNATURE & MIXES
    {
      id: 'hesham-fouad-signature',
      categoryId: 'signature',
      name: 'كريب هشام فؤاد (الوحش)',
      isSignature: true,
      popular: true,
      price: 150,
      description: 'مكس جريل استيك مشوي + شيش طاووق + كفتة مشوية + صدور فراخ مشوية + روز بيف مدخن + صوص تكساس + صوص باربكيو الأصلي.',
      image: 'assets/images/hesham-holding-crepe.png',
      tags: ['توقيع المحل', 'أضخم كريب', 'مشويات مشكلة']
    },
    {
      id: 'mix-toscany',
      categoryId: 'signature',
      name: 'كريب توسكانيني',
      popular: true,
      price: 135,
      description: 'صدور فراخ مشوية على الجريل + قطع زنجر حار مقرمش + بطاطس فارم فريتس + هالابينو مع صوص بافلو حار وصوص بيج تايستي الغني.',
      image: 'assets/images/crispy-chicken-crepe.png',
      tags: ['حار', 'زنجر وشوي']
    },
    {
      id: 'mix-milano',
      categoryId: 'signature',
      name: 'كريب ميلانو',
      popular: true,
      price: 130,
      description: 'استربس دجاج مقرمش + هوت دوج فرانكفورتر + تركي مدخن + شاورما فراخ سورية مع صوص الشيدر السايح.',
      image: 'assets/images/trio-crepe.png',
      tags: ['ميكس أجبان', 'استربس وهوت دوج']
    },
    {
      id: 'mix-chicago',
      categoryId: 'signature',
      name: 'كريب شيكاغو',
      price: 130,
      description: 'قطع تشيكن ألفريدو المقرمشة + موتزاريلا ستيكس مقلية مطاطية + تركي مدخن مع صوص الشيدر والباربكيو.',
      image: 'assets/images/crunchy-chicken-cheese.png',
      tags: ['موتزاريلا ستيكس', 'شيكاغو ستايل']
    },
    {
      id: 'mix-moscow',
      categoryId: 'signature',
      name: 'كريب موسكو',
      price: 130,
      description: 'قطع كوردن بلو غرقانة جبنة + شاورما فراخ متبلة + سوسيس ممتاز مع صوص الشيدر السايح وصوص الألف جزيرة.',
      image: 'assets/images/crepe-cross-section.png',
      tags: ['كوردن بلو', 'شيدر']
    },
    {
      id: 'mix-supreme',
      categoryId: 'signature',
      name: 'كريب سوبر سوبريم',
      price: 130,
      description: 'برجر لحم بلدي مشوي + سجق شرقي اسكندراني + سوسيس متبل + كفتة مشوية على الفحم مع تشكيلة أجبان وصوصات.',
      image: 'assets/images/crepe-cone-loaded.png',
      tags: ['لحوم مشكلة', 'سوبريم']
    },
    {
      id: 'mix-amsterdam',
      categoryId: 'signature',
      name: 'كريب أمستردام',
      price: 125,
      description: 'شيش طاووق فراخ مشوي طري + سجق شرقي بلدي مع صوص الرانش المخصوص والبيج تايستي.',
      image: 'assets/images/crispy-chicken-crepe.png',
      tags: ['شيش وسجق', 'رانش']
    },
    {
      id: 'mix-sofia',
      categoryId: 'signature',
      name: 'كريب صوفيا',
      price: 125,
      description: 'برجر لحمة صلبة مشوية + روز بيف مدخن فاخر + بطاطس مقلية ذهبية مع صوص التكساس وصوص الشيدر الهولندي.',
      image: 'assets/images/crepe-varieties.png',
      tags: ['برجر وروز بيف']
    },
    {
      id: 'mix-sujouk-kiri',
      categoryId: 'signature',
      name: 'كريب سجق كيري',
      popular: true,
      price: 120,
      description: 'سجق شرقي بلدي متبل بخلطة هشام فؤاد الخاصة غرقان في مربعات جبنة كيري كريمية غنية وسايحة.',
      image: 'assets/images/crepe-cross-section.png',
      tags: ['سجق بلدي', 'جبنة كيري']
    },
    {
      id: 'mix-chicken-quad',
      categoryId: 'signature',
      name: 'كريب ميكس فراخ رباعي',
      popular: true,
      price: 120,
      description: 'فرايد تشيكن كرسبي + شاورما فراخ جريل + شيش طاووق متبل + تركي مدخن مع خس وصوصات خاصة.',
      image: 'assets/images/trio-crepe.png',
      tags: ['4 أنواع فراخ', 'محبوب الشباب']
    },
    {
      id: 'mix-smoked',
      categoryId: 'signature',
      name: 'كريب ميكس مدخن',
      price: 120,
      description: 'روز بيف مدخن + سلامي فاخر + تركي مدخن + ميكس جبن شيدر وموتزاريلا ورومي سايح.',
      image: 'assets/images/hesham-governorate.png',
      tags: ['مدخنات', 'روز بيف وسلامي']
    },
    {
      id: 'mix-super-crunchy',
      categoryId: 'signature',
      name: 'كريب سوبر كرانشي',
      price: 115,
      description: 'قطع استربس دجاج سوبر مقرمشة مع سلامي بقري وصوص الكوكتيل اللذيذ وجبنة مطاطية.',
      image: 'assets/images/crunchy-chicken-cheese.png',
      tags: ['كرانشي', 'استربس وسلامي']
    },

    // 2. CHICKEN CREPES
    {
      id: 'chk-ranch',
      categoryId: 'chicken',
      name: 'كريب تشيكن رانش',
      popular: true,
      price: 120,
      description: 'قطع صدور دجاج مشوية طازجة مغطاة بصوص الرانش الكريمي الغني مع الخس والزيتون والموتزاريلا.',
      image: 'assets/images/crispy-chicken-crepe.png',
      tags: ['رانش', 'صدور طازجة']
    },
    {
      id: 'chk-bbq',
      categoryId: 'chicken',
      name: 'كريب تشيكن باربكيو',
      price: 120,
      description: 'قطع دجاج متبلة على الجريل مع صوص الباربكيو المدخن اللذيذ والموتزاريلا السايحة.',
      image: 'assets/images/crepe-varieties.png',
      tags: ['باربكيو', 'مدخن']
    },
    {
      id: 'chk-grilled-breast',
      categoryId: 'chicken',
      name: 'كريب صدور مشوية',
      price: 115,
      description: 'صدور دجاج مشوية صحية ومتبلة بالأعشاب والليمون مع ميكس خضار وجبن خفيف وصوصات ممتازة.',
      image: 'assets/images/crepe-cross-section.png',
      tags: ['مشوي خفيف', 'صدور صافي']
    },
    {
      id: 'chk-shish',
      categoryId: 'chicken',
      name: 'كريب شيش طاووق',
      price: 115,
      description: 'أوراك دجاج طرية متبلة تتبيلة الشيش الأصلية مع الفلفل الألوان والبصل المشوي والجبنة.',
      image: 'assets/images/trio-crepe.png',
      tags: ['شيش طاووق']
    },
    {
      id: 'chk-fajita',
      categoryId: 'chicken',
      name: 'كريب فاهيتا فراخ',
      price: 115,
      description: 'شرائح دجاج مع فلفل ألوان وبصل وتوابل مكسيكية على الجريل وصوص لذيذ.',
      image: 'assets/images/crepe-varieties.png',
      tags: ['فاهيتا مكسيكي']
    },
    {
      id: 'chk-shawarma',
      categoryId: 'chicken',
      name: 'كريب شاورما فراخ',
      popular: true,
      price: 105,
      description: 'شاورما دجاج متبلة على السيخ السوري مع تومية وخيار مخلل وجبنة موتزاريلا بتمط.',
      image: 'assets/images/crepe-cone-loaded.png',
      tags: ['شاورما سوري', 'الأكثر شعبية']
    },
    {
      id: 'chk-cordon-bleu',
      categoryId: 'chicken',
      name: 'كريب كوردن بلو',
      popular: true,
      price: 105,
      description: 'رولات صدور الدجاج المقرمشة المحشوة جبنة شيدر وسموكد بيف السايحة مع صوصاتنا.',
      image: 'assets/images/crunchy-chicken-cheese.png',
      tags: ['كوردن بلو']
    },
    {
      id: 'chk-strips',
      categoryId: 'chicken',
      name: 'كريب ستربس دجاج',
      popular: true,
      price: 95,
      description: 'أصابع صدور دجاج ستربس مقرمشة ذهبية مع صوص الجبنة الشيدر وخس طازج وموتزاريلا.',
      image: 'assets/images/crispy-chicken-crepe.png',
      tags: ['كرسبي', 'استربس']
    },
    {
      id: 'chk-zinger',
      categoryId: 'chicken',
      name: 'كريب زنجر حار',
      popular: true,
      price: 95,
      description: 'قطع زنجر حارة ومقرمشة لعشاق الحار مع صوص المايونيز الحار والموتزاريلا.',
      image: 'assets/images/crunchy-chicken-cheese.png',
      tags: ['حار', 'زنجر']
    },
    {
      id: 'chk-pane',
      categoryId: 'chicken',
      name: 'كريب بانيه كرسبي',
      price: 95,
      description: 'قطع بانيه فراخ ذهبية متبلة كرسبي مع الجبنة الرومي والموتزاريلا والبطاطس.',
      image: 'assets/images/trio-crepe.png',
      tags: ['بانيه مصري']
    },
    {
      id: 'chk-nuggets',
      categoryId: 'chicken',
      name: 'كريب نجتس',
      price: 95,
      description: 'قطع ناجتس دجاج ذهبية مقرمشة محبوبة الأطفال والكبار مع بطاطس وصوصات.',
      image: 'assets/images/crepe-cone-loaded.png',
      tags: ['ناجتس']
    },

    // 3. MEAT & STEAK CREPES
    {
      id: 'meat-steak',
      categoryId: 'meat',
      name: 'كريب ستيك مشوي',
      popular: true,
      price: 120,
      description: 'شرائح لحم بقري ستيك مشوية على الجريل بتتبيلة الزبدة والثوم مع المشروم والجبنة الموتزاريلا.',
      image: 'assets/images/hesham-holding-crepe.png',
      tags: ['ستيك بقري', 'فاخر']
    },
    {
      id: 'meat-burger',
      categoryId: 'meat',
      name: 'كريب برجر لحمة',
      popular: true,
      price: 105,
      description: 'أقراص برجر لحم بقري متبلة مشوية مع صوص الجبنة الشيدر، مخلل، وبطاطس.',
      image: 'assets/images/crepe-cross-section.png',
      tags: ['برجر شيدر']
    },
    {
      id: 'meat-pastrami',
      categoryId: 'meat',
      name: 'كريب بسطرمة بلدي',
      price: 100,
      description: 'بسطرمة بلدي صافية غرقانة جبنة موتزاريلا ورومي وزيتون مخلي وفلفل ألوان.',
      image: 'assets/images/hesham-governorate.png',
      tags: ['بسطرمة بلدي']
    },
    {
      id: 'meat-salami',
      categoryId: 'meat',
      name: 'كريب سلامي بقري',
      price: 100,
      description: 'شرائح سلامي بقري فاخر مع ميكس أجبان وصوص البيتزا الخاص الإيطالي.',
      image: 'assets/images/crepe-varieties.png',
      tags: ['سلامي مدخن']
    },
    {
      id: 'meat-sujouk',
      categoryId: 'meat',
      name: 'كريب سجق شرقي',
      popular: true,
      price: 95,
      description: 'سجق شرقي بلدي محمر على الجريل ببهارات صعيدية أصيلة وطماطم وفلفل وجبنة.',
      image: 'assets/images/trio-crepe.png',
      tags: ['سجق إسكندراني']
    },
    {
      id: 'meat-kofta',
      categoryId: 'meat',
      name: 'كريب كفتة مشوية',
      price: 95,
      description: 'كفتة لحمة مشوية على الفحم بطعم الكبابجي مع طحينة وخضار وموتزاريلا.',
      image: 'assets/images/crepe-cross-section.png',
      tags: ['كفتة حاتي']
    },
    {
      id: 'meat-hotdog',
      categoryId: 'meat',
      name: 'كريب هوت دوج فرانكفورت',
      price: 90,
      description: 'هوت دوج مشوي ومتبل مع الماسترد والكاتشب والجبنة الموتزاريلا الذائبة.',
      image: 'assets/images/crepe-cone-loaded.png',
      tags: ['هوت دوج']
    },
    {
      id: 'meat-sausage',
      categoryId: 'meat',
      name: 'كريب سوسيس كلاسيك',
      price: 90,
      description: 'أصابع سوسيس لحم بقري مدخن على الجريل مع صوص الشيدر والبطاطس المقرمشة.',
      image: 'assets/images/crispy-chicken-crepe.png',
      tags: ['سوسيس']
    },

    // 4. FRIES & CHEESE CREPES
    {
      id: 'fries-mix-cheese',
      categoryId: 'fries',
      name: 'كريب ميكس جبن رويال',
      popular: true,
      price: 80,
      description: 'حشو مضاعف من جبنة موتزاريلا طبيعية مطاطية + جبنة رومي قديمة + شيدر هولندي سايح مع صوص الجبنة والزيتون.',
      image: 'assets/images/crepe-cross-section.png',
      tags: ['ميكس أجبان', 'عشاق الجبنة']
    },
    {
      id: 'fries-potato',
      categoryId: 'fries',
      name: 'كريب بطاطس فارم فريتس',
      price: 60,
      description: 'بطاطس مقلية ذهبية مقرمشة غرقانة صوص جبنة شيدر وكاتشب ومايونيز وموتزاريلا.',
      image: 'assets/images/crunchy-chicken-cheese.png',
      tags: ['بطاطس مقرمشة', 'سعر اقتصادي']
    },

    // 5. SWEET CREPES
    {
      id: 'swt-apple-cinnamon',
      categoryId: 'sweet',
      name: 'كريب تفاحة بالكراميل والقرفة',
      popular: true,
      price: 120,
      description: 'شرائح تفاح مكرمل بالقرفة والزبدة مع كريمة البستري الإيطالية ومكسرات فاخرة وصوص كراميل.',
      image: 'assets/images/crepe-cross-section.png',
      tags: ['تفاح مكرمل', 'كريمة بستري ومكسرات']
    },
    {
      id: 'swt-mango',
      categoryId: 'sweet',
      name: 'كريب منجاية منعش',
      popular: true,
      price: 120,
      description: 'قطع مانجو طازجة مع كريمة باستري مخفوقة ومكسرات كاجو ولوز وصوص مانجو طبيعي.',
      image: 'assets/images/crepe-varieties.png',
      tags: ['مانجو طبيعي', 'مكسرات']
    },
    {
      id: 'swt-pineapple',
      categoryId: 'sweet',
      name: 'كريب أناناس استوائي',
      price: 120,
      description: 'قطع أناناس مسكر مع صوص وايت شوكلت وكريمة باستري ومكسرات محمصة.',
      image: 'assets/images/crepe-varieties.png',
      tags: ['أناناس استوائي']
    },
    {
      id: 'swt-peach',
      categoryId: 'sweet',
      name: 'كريب خوخة',
      price: 115,
      description: 'قطع خوخ شهية مع كريمة الباستري وصوص الفراولة والمكسرات الغنية.',
      image: 'assets/images/crepe-cross-section.png',
      tags: ['خوخ']
    },
    {
      id: 'swt-banana',
      categoryId: 'sweet',
      name: 'كريب بنانا شوكلت',
      popular: true,
      price: 115,
      description: 'حلقات موز طازج مغطاة بشلال نوتيلا أصلي مع كريمة الباستري والمكسرات المقرمشة.',
      image: 'assets/images/crepe-cross-section.png',
      tags: ['موز ونوتيلا', 'كلاسيك']
    },
    {
      id: 'swt-nutella-oreo',
      categoryId: 'sweet',
      name: 'كريب نوتيلا أوريو',
      popular: true,
      price: 105,
      description: 'شوكولاتة نوتيلا أصلية مع قطع بسكويت أوريو المطحونة وكريمة باستري ومكسرات.',
      image: 'assets/images/crepe-varieties.png',
      tags: ['نوتيلا وأوريو']
    },
    {
      id: 'swt-nutella-classic',
      categoryId: 'sweet',
      name: 'كريب نوتيلا كلاسيك',
      popular: true,
      price: 100,
      description: 'كريب سخن محشو شلال نوتيلا بلجيكي ناعم مع رشة مكسرات بندق ولوز وكريمة الباستري.',
      image: 'assets/images/crepe-cross-section.png',
      tags: ['نوتيلا صافي']
    },
    {
      id: 'swt-lotus',
      categoryId: 'sweet',
      name: 'كريب لوتس كراميل',
      price: 90,
      description: 'زبدة لوتس أصلية دافئة مع بسكويت لوتس مكسر ورشة قرفة وكريمة باستري.',
      image: 'assets/images/crepe-varieties.png',
      tags: ['لوتس أصلي']
    },
    {
      id: 'swt-pistachio',
      categoryId: 'sweet',
      name: 'كريب بستاشيو فاخر',
      popular: true,
      price: 90,
      description: 'زبدة فستق حلبي بيستاشيو خضراء كريمية مع فستق مطحون وكريمة باستري خفيفة.',
      image: 'assets/images/crepe-varieties.png',
      tags: ['فستق بستاشيو']
    },
    {
      id: 'swt-kinder',
      categoryId: 'sweet',
      name: 'كريب كيندر بوينو',
      price: 90,
      description: 'شوكولاتة كيندر ناعمة بالحليب والبندق مع كريمة باستري ومكسرات.',
      image: 'assets/images/crepe-cross-section.png',
      tags: ['كيندر شوكولاتة']
    },
    {
      id: 'swt-white-choc',
      categoryId: 'sweet',
      name: 'كريب وايت شوكلت',
      price: 90,
      description: 'شوكولاتة بيضاء فاخرة دافئة مع كريمة الباستري ومكسرات لوز محمص.',
      image: 'assets/images/crepe-varieties.png',
      tags: ['وايت شوكلت']
    },
    {
      id: 'swt-strawberry-jam',
      categoryId: 'sweet',
      name: 'كريب مربى فراولة بالسمنة البلدي',
      price: 80,
      description: 'كريب طازج بمربى الفراولة بقطع الفاكهة مع كريمة باستري ورشة مكسرات.',
      image: 'assets/images/crepe-cross-section.png',
      tags: ['مربى فراولة']
    },
    {
      id: 'swt-fig-jam',
      categoryId: 'sweet',
      name: 'كريب مربى تين صعيدي',
      price: 80,
      description: 'مربى تين طبيعية ناعمة مع كريمة الباستري والمكسرات.',
      image: 'assets/images/crepe-cross-section.png',
      tags: ['مربى تين']
    }
  ];

  const galleryVideos = [
    {
      id: 'reel-1',
      title: 'تحضير أضخم كريب مشكل في أسيوط',
      src: 'assets/videos/reel-1.mp4',
      duration: 'فيديو'
    },
    {
      id: 'reel-2',
      title: 'شلال الجبنة والصوصات الفاخرة',
      src: 'assets/videos/reel-2.mp4',
      duration: 'فيديو'
    },
    {
      id: 'reel-3',
      title: 'كواليس شغل الشيف هشام فؤاد',
      src: 'assets/videos/reel-3.mp4',
      duration: 'فيديو'
    }
  ];

  const galleryPhotos = [
    { src: 'assets/images/hesham-holding-crepe.png', caption: 'الشيف هشام فؤاد مع كريب الوحش' },
    { src: 'assets/images/hesham-storefront.png', caption: 'واجهة المحل في شارع المحافظة بأسيوط' },
    { src: 'assets/images/hesham-governorate.png', caption: 'أمام مبنى محافظة أسيوط مع أضخم كريب' },
    { src: 'assets/images/crispy-chicken-crepe.png', caption: 'كريب استربس كرسبي غرقان شيدر' },
    { src: 'assets/images/trio-crepe.png', caption: 'ثلاثي كريبات هشام فؤاد' },
    { src: 'assets/images/crepe-cross-section.png', caption: 'كريب محشو جبنة موتزاريلا وصوصات سايحة' }
  ];

  if (typeof window !== 'undefined') {
    window.HeshamFouadData = {
      restaurantInfo,
      categories,
      extraAddons,
      extraSauces,
      sweetSauces,
      menuItems,
      galleryVideos,
      galleryPhotos
    };
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
      restaurantInfo,
      categories,
      extraAddons,
      extraSauces,
      sweetSauces,
      menuItems,
      galleryVideos,
      galleryPhotos
    };
  }
})();
