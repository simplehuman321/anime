document.addEventListener('DOMContentLoaded', () => {
    const animeCarousel = document.getElementById('anime-carousel');
    const mainTitle = document.getElementById('main-title');
    const body = document.getElementById('body');
    const clickSound = document.getElementById('click-sound');
    const carouselContainer = document.querySelector('.carousel-container');

    let animeData = [];
    const scrollSpeed = 0.5; // Kaydırma hızını yavaşlatmak için çarpan
    let originalCarouselWidth = 0; // Orijinal içeriğin toplam genişliği
    let isCloningDone = false; // Klonlama işleminin tamamlanıp tamamlanmadığını kontrol eder

    // texts/animeler.txt dosyasını oku
    fetch('texts/animeler.txt')
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status} - Could not load texts/animeler.txt`);
            }
            return response.text();
        })
        .then(data => {
            const lines = data.trim().split('\n');
            animeData = lines.map(line => {
                const parts = line.split('/');
                if (parts.length === 3) {
                    return {
                        name: parts[0].trim(),
                        boxImage: parts[1].trim(),
                        backgroundImage: parts[2].trim()
                    };
                }
                return null;
            }).filter(item => item !== null);

            if (animeData.length > 0) {
                updateDisplay(animeData[0].name, animeData[0].backgroundImage);
                createAnimeBoxes(); // Kutuları oluştur ve klonla
            } else {
                mainTitle.textContent = "Anime verisi bulunamadı. Lütfen texts/animeler.txt dosyasını kontrol edin.";
            }
        })
        .catch(error => {
            console.error('Anime verileri okunurken bir hata oluştu:', error);
            mainTitle.textContent = "Veriler yüklenemedi. Lütfen konsolu kontrol edin.";
        });

    // Genel ekran kaydırmasını yakala (body üzerinden)
    if (carouselContainer) {
        body.addEventListener('wheel', (event) => {
            event.preventDefault(); // Varsayılan dikey kaydırmayı engelle
            carouselContainer.scrollLeft += event.deltaY * scrollSpeed; // Yavaşlatılmış kaydırma
        }, { passive: false }); 
    }

    // Sonsuz kaydırma mantığı için event listener
    // Bu listener, klonlama işlemi tamamlandıktan sonra etkin olacak
    if (carouselContainer) {
        carouselContainer.addEventListener('scroll', () => {
            if (!isCloningDone) return; // Klonlama bitmeden tetiklenmesini engelle

            const { scrollWidth, clientWidth, scrollLeft } = carouselContainer;
            const scrollThreshold = originalCarouselWidth; // Işınlanma için eşik değeri

            // Eğer sona doğru kaydırıp orijinal içeriğin son kopyasına geldiysek
            if (scrollLeft >= scrollThreshold + originalCarouselWidth) {
                // Orijinal içeriğin başına geri dön
                carouselContainer.scrollLeft = scrollThreshold;
            }
            // Eğer başa doğru kaydırıp orijinal içeriğin ilk kopyasına geldiysek
            else if (scrollLeft <= 0) {
                // Orijinal içeriğin sonuna geri dön
                carouselContainer.scrollLeft = scrollThreshold + originalCarouselWidth;
            }
        });
    }

    // Anime kutucuklarını oluşturma ve sonsuz scroll için kopyalama
    function createAnimeBoxes() {
        animeCarousel.innerHTML = ''; // Mevcut kutuları temizle

        // Önce orijinal kutuları oluştur
        animeData.forEach(anime => {
            const animeBox = createSingleAnimeBox(anime);
            animeCarousel.appendChild(animeBox);
        });

        // Orijinal içerik genişliğini hesapla (klonlama öncesi)
        // Bu önemli: `offsetWidth` her eleman için padding+border+content içerir.
        // `getComputedStyle` ile `gap` değerini de almalıyız.
        const firstBox = animeCarousel.querySelector('.anime-box');
        if (firstBox) {
            const boxWidth = firstBox.offsetWidth;
            const gap = parseFloat(getComputedStyle(animeCarousel).gap || '0'); // '30px' -> 30
            originalCarouselWidth = (boxWidth + gap) * animeData.length - gap; // Toplam genişlik - son gap
            // `carousel-container` padding'ini de dikkate almanız gerekebilir.
        } else {
             originalCarouselWidth = 0; // Kutucuk yoksa genişlik 0
        }
        
        // Klonları ekle
        setupInfiniteScrollClones();
    }

    // Tek bir anime kutucuğu oluşturan yardımcı fonksiyon
    function createSingleAnimeBox(anime) {
        const animeBox = document.createElement('div');
        animeBox.classList.add('anime-box');

        const img = document.createElement('img');
        img.src = `images/${anime.boxImage}`;
        img.alt = anime.name;

        animeBox.appendChild(img);

        animeBox.addEventListener('mouseenter', () => {
            updateDisplay(anime.name, anime.backgroundImage);
            if (clickSound) {
                clickSound.currentTime = 0;
                clickSound.play().catch(e => console.log("Ses çalma hatası:", e));
            }
        });
        return animeBox;
    }

    // Sonsuz kaydırma için klonları oluşturma ve başlangıç konumu ayarlama
    function setupInfiniteScrollClones() {
        if (animeData.length === 0) {
            isCloningDone = true; // Klonlanacak bir şey yoksa bile işaretle
            return;
        };

        // Klonlama öncesi mevcut elemanların kopyalarını al
        // animeCarousel.children, live bir HTMLCollection olduğu için Array.from ile kopyalıyoruz
        const originalChildren = Array.from(animeCarousel.children);

        // Başa kopyalar ekle: Orijinal içeriğin sonu
        originalChildren.reverse().forEach(child => { // Ters sırada ekleyerek düzgün akışı sağla
            const clone = child.cloneNode(true); // Tüm alt elemanları kopyala
            animeCarousel.insertBefore(clone, animeCarousel.firstChild);
        });

        // Sona kopyalar ekle: Orijinal içeriğin başı
        originalChildren.reverse().forEach(child => { // Tekrar düz sıraya getir
            const clone = child.cloneNode(true);
            animeCarousel.appendChild(clone);
        });
        
        // Başlangıçta kaydırma pozisyonunu orijinal içeriğin başına ayarla
        // Bu, soldaki klonlanmış setin hemen sonrasıdır.
        carouselContainer.scrollLeft = originalCarouselWidth;

        // Klonlama işlemi tamamlandı işaretini ver
        isCloningDone = true;
    }

    // Başlık ve arka planı güncelleyen fonksiyon
    function updateDisplay(title, background) {
        mainTitle.textContent = title;
        body.style.backgroundImage = `url('images/${background}')`;
    }
});
