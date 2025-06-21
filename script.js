document.addEventListener('DOMContentLoaded', () => {
    const animeCarousel = document.getElementById('anime-carousel');
    const mainTitle = document.getElementById('main-title');
    const body = document.getElementById('body');
    const clickSound = document.getElementById('click-sound'); // Ses elementi

    let animeData = []; // Tüm anime verilerini tutacak

    // texts/animeler.txt dosyasını oku
    fetch('texts/animeler.txt')
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.text();
        })
        .then(data => {
            // Satır satır ayır ve her satırı '/' ile böl
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
                return null; // Eksik veri içeren satırları atla
            }).filter(item => item !== null); // null olanları temizle

            if (animeData.length > 0) {
                // İlk animeyi varsayılan olarak ayarla
                updateDisplay(animeData[0].name, animeData[0].backgroundImage);
                createAnimeBoxes();
            } else {
                mainTitle.textContent = "Anime verisi bulunamadı.";
            }
        })
        .catch(error => {
            console.error('Anime verileri okunurken bir hata oluştu:', error);
            mainTitle.textContent = "Veriler yüklenemedi.";
        });

    // Anime kutucuklarını oluşturma fonksiyonu
    function createAnimeBoxes() {
        animeData.forEach(anime => {
            const animeBox = document.createElement('div');
            animeBox.classList.add('anime-box');

            const img = document.createElement('img');
            img.src = `images/${anime.boxImage}`;
            img.alt = anime.name;

            animeBox.appendChild(img);
            animeCarousel.appendChild(animeBox);

            // Fare üzerine gelme (hover) olayları
            animeBox.addEventListener('mouseenter', () => {
                updateDisplay(anime.name, anime.backgroundImage);
                if (clickSound) {
                    clickSound.currentTime = 0; // Sesi baştan başlat
                    clickSound.play().catch(e => console.log("Ses çalma hatası:", e)); // Otomatik oynatma politikalarını yönet
                }
            });

            // Fare kutucuktan ayrılma (mouseleave) olayı
            // Şimdilik herhangi bir anime kutucuğundan ayrılınca varsayılan durum korunacak.
            // İsterseniz mouseleave'de ilk animeye dönebiliriz.
            // animeBox.addEventListener('mouseleave', () => {
            //     updateDisplay(animeData[0].name, animeData[0].backgroundImage);
            // });
        });
    }

    // Başlık ve arka planı güncelleyen fonksiyon
    function updateDisplay(title, background) {
        mainTitle.textContent = title;
        body.style.backgroundImage = `url('images/${background}')`;
    }
});

document.addEventListener('DOMContentLoaded', () => {
    const animeCarousel = document.getElementById('anime-carousel');
    const mainTitle = document.getElementById('main-title');
    const body = document.getElementById('body');
    const clickSound = document.getElementById('click-sound');

    // Yeni eklenen carouselContainer (kaydırma için)
    const carouselContainer = document.querySelector('.carousel-container'); // Corrected selector

    let animeData = [];

    // texts/animeler.txt dosyasını oku
    fetch('texts/animeler.txt')
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
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
                createAnimeBoxes();
            } else {
                mainTitle.textContent = "Anime verisi bulunamadı.";
            }
        })
        .catch(error => {
            console.error('Anime verileri okunurken bir hata oluştu:', error);
            mainTitle.textContent = "Veriler yüklenemedi.";
        });

    // *** BURADAN BAŞLAYARAK YENİ KOD EKLENECEK ***
    // Mouse tekerleği ile yatay kaydırma
    if (carouselContainer) { // carouselContainer'ın varlığını kontrol et
        carouselContainer.addEventListener('wheel', (event) => {
            event.preventDefault(); // Varsayılan dikey kaydırmayı engelle
            carouselContainer.scrollLeft += event.deltaY; // Dikey kaydırma miktarını yataya uygula
        });
    }
    // *** YENİ KOD BURADA BİTİYOR ***


    function createAnimeBoxes() {
        animeData.forEach(anime => {
            const animeBox = document.createElement('div');
            animeBox.classList.add('anime-box');

            const img = document.createElement('img');
            img.src = `images/${anime.boxImage}`;
            img.alt = anime.name;

            animeBox.appendChild(img);
            animeCarousel.appendChild(animeBox);

            animeBox.addEventListener('mouseenter', () => {
                updateDisplay(anime.name, anime.backgroundImage);
                if (clickSound) {
                    clickSound.currentTime = 0;
                    clickSound.play().catch(e => console.log("Ses çalma hatası:", e));
                }
            });
        });
    }

    function updateDisplay(title, background) {
        mainTitle.textContent = title;
        body.style.backgroundImage = `url('images/${background}')`;
    }
});
