document.addEventListener('DOMContentLoaded', () => {
    const animeCarousel = document.getElementById('anime-carousel');
    const mainTitle = document.getElementById('main-title');
    const body = document.getElementById('body');
    const clickSound = document.getElementById('click-sound');
    const carouselContainer = document.querySelector('.carousel-container');

    let animeData = [];
    // Kaydırma hızını yavaşlatmak için çarpan (0.1 daha yavaş, 1 daha hızlı)
    // Bu değeri deneyerek size en uygun hızı bulabilirsiniz.
    const scrollSpeed = 0.5; 
    let clonedElementsWidth = 0; // Klonlanmış elemanların toplam genişliği

    // texts/animeler.txt dosyasını oku
    fetch('texts/animeler.txt')
        .then(response => {
            if (!response.ok) {
                // Eğer dosya bulunamazsa veya sunucu hatası olursa
                throw new Error(`HTTP error! status: ${response.status} - Could not load texts/animeler.txt`);
            }
            return response.text();
        })
        .then(data => {
            // Satır satır ayır ve her satırı '/' ile böl
            const lines = data.trim().split('\n');
            animeData = lines.map(line => {
                const parts = line.split('/');
                if (parts.length === 3) { // Anime Adı / Kutucuk Resmi / Arka Plan Resmi
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
                createAnimeBoxes(); // İlk yüklemede kutuları oluştur

                // Sonsuz kaydırma için kopyaları oluştur
                setupInfiniteScroll();
            } else {
                mainTitle.textContent = "Anime verisi bulunamadı. Lütfen texts/animeler.txt dosyasını kontrol edin.";
            }
        })
        .catch(error => {
            console.error('Anime verileri okunurken bir hata oluştu:', error);
            mainTitle.textContent = "Veriler yüklenemedi. Lütfen konsolu kontrol edin.";
        });

    // Genel ekran kaydırmasını yakala (body üzerinden)
    // carouselContainer'ın da varlığını kontrol ediyoruz ki hata vermesin
    if (carouselContainer) { 
        body.addEventListener('wheel', (event) => {
            event.preventDefault(); // Varsayılan dikey kaydırmayı engelle

            // Yavaşlatılmış kaydırma
            carouselContainer.scrollLeft += event.deltaY * scrollSpeed;
        }, { passive: false }); // `passive: false` ekleyerek `preventDefault`'ın çalışmasını garanti altına alıyoruz
    }
    

    // Sonsuz kaydırma mantığı için event listener (carouselContainer'ın kendi scroll'u)
    if (carouselContainer) {
        carouselContainer.addEventListener('scroll', () => {
            const { scrollWidth, clientWidth, scrollLeft } = carouselContainer;

            // Eğer sona yaklaşıyorsa (sağ taraftan)
            // Klonlanmış öğelerin yarısına yaklaştığımızda başa dönüyoruz.
            // Bu, klonların toplam genişliğinin yarısı kadar bir mesafe olmalı.
            const threshold = (scrollWidth - clientWidth) - (clonedElementsWidth / 2);

            if (scrollLeft >= threshold) {
                // Karuselin gerçek başına geri dön (klonların bittiği yere)
                carouselContainer.scrollLeft = (clonedElementsWidth / 2) + 50; // Biraz boşluk bırakalım
            }
            // Eğer başa yaklaşıyorsa (sol taraftan)
            // Klonlanmış öğelerin başlangıcına geldiğimizde sona dönüyoruz.
            else if (scrollLeft <= (clonedElementsWidth / 2) - 50) { // Biraz boşluk bırakalım
                // Karuselin gerçek sonuna geri dön
                carouselContainer.scrollLeft = scrollWidth - (clonedElementsWidth) - clientWidth + (clonedElementsWidth / 2) - 50;
                 // Basit hali: scrollWidth - (gerçek içerik genişliği) - klonlanmışların başa eklenen kısmı
            }
             // Daha doğru bir "ışınlanma" noktası:
             // Eğer ilk klonlanmış gruba geri sarıyorsak, gerçek içeriğin başlangıcına atla.
            if (carouselContainer.scrollLeft < 10 && carouselContainer.scrollLeft > 0) { // 0'a çok yakınsa
                 carouselContainer.scrollLeft = scrollWidth - (clonedElementsWidth * 2) - (clientWidth - 100); // Daha dinamik bir sona atlama
            } else if (carouselContainer.scrollLeft + clientWidth > scrollWidth - 10) { // Sona çok yakınsa
                 carouselContainer.scrollLeft = (clonedElementsWidth * 2) + 100; // Başa atlama
            }
        });
    }

    // Anime kutucuklarını oluşturma fonksiyonu
    function createAnimeBoxes() {
        // Mevcut kutuları temizle (sonsuz scroll için tekrar oluşturmadan önce)
        animeCarousel.innerHTML = ''; 

        // Gerçek anime kutucuklarını ekle
        animeData.forEach(anime => {
            const animeBox = createSingleAnimeBox(anime);
            animeCarousel.appendChild(animeBox);
        });
    }

    // Tek bir anime kutucuğu oluşturan yardımcı fonksiyon
    function createSingleAnimeBox(anime) {
        const animeBox = document.createElement('div');
        animeBox.classList.add('anime-box');

        const img = document.createElement('img');
        img.src = `images/${anime.boxImage}`;
        img.alt = anime.name;

        animeBox.appendChild(img);

        // Fare üzerine gelme (hover) olayları
        animeBox.addEventListener('mouseenter', () => {
            updateDisplay(anime.name, anime.backgroundImage);
            if (clickSound) {
                clickSound.currentTime = 0; // Sesi baştan başlat
                // play() hatasını yakala, kullanıcı etkileşimi olmadan çalmayı engeller
                clickSound.play().catch(e => console.log("Ses çalma hatası:", e)); 
            }
        });
        return animeBox;
    }

    // Sonsuz kaydırma için kopyaları oluşturma ve başlangıç konumu ayarlama
    function setupInfiniteScroll() {
        if (animeData.length === 0) return;

        // Klonlanacak öğe sayısı: En azından görünen öğe sayısı kadar olmalı.
        // Genellikle 3-5 arası kopya, yeterli bir "sonsuzluk" hissi verir.
        const numToClone = Math.min(animeData.length, 5); // Örneğin ilk 5 tanesini kopyala

        // İlk birkaç öğeyi sona kopyala
        for (let i = 0; i < numToClone; i++) {
            const clone = createSingleAnimeBox(animeData[i]);
            animeCarousel.appendChild(clone);
        }

        // Son birkaç öğeyi başa kopyala (ters sırada eklemeliyiz ki doğru sıra korunsun)
        for (let i = animeData.length - numToClone; i < animeData.length; i++) {
            const clone = createSingleAnimeBox(animeData[i]);
            animeCarousel.insertBefore(clone, animeCarousel.firstChild);
        }

        // Klonlanmış elemanların toplam genişliğini hesapla
        // Tüm kutucukların genişliğini ve aralarındaki boşluğu (gap) manuel olarak hesaplıyoruz.
        // Bu hesaplama, sonsuz kaydırmanın doğru çalışması için kritik.
        // anime-box genişliği (300px) + gap (30px)
        clonedElementsWidth = (300 + 30) * numToClone; 
        
        // Başlangıçta klonlanmış elemanların sonuna, yani gerçek içeriğin başlangıcına konumlandır
        // Bu, kullanıcının doğrudan gerçek içerikten başlamasını sağlar
        carouselContainer.scrollLeft = clonedElementsWidth;

        // Sonsuz kaydırma için scroll konumunu izle ve gerektiğinde atla
        carouselContainer.addEventListener('scroll', () => {
            const { scrollWidth, clientWidth, scrollLeft } = carouselContainer;
            const originalContentWidth = scrollWidth - (clonedElementsWidth * 2); // Toplam genişlik - 2 set klon

            // Eğer gerçek içeriğin sonuna geliniyorsa (sağdaki klonlara geçiş)
            if (scrollLeft >= clonedElementsWidth + originalContentWidth) {
                // Gerçek içeriğin başlangıcına atla
                carouselContainer.scrollLeft = clonedElementsWidth + (scrollLeft - (clonedElementsWidth + originalContentWidth));
            }
            // Eğer gerçek içeriğin başına geliniyorsa (soldaki klonlara geçiş)
            else if (scrollLeft < clonedElementsWidth) {
                // Gerçek içeriğin sonuna atla
                carouselContainer.scrollLeft = (clonedElementsWidth + originalContentWidth) - (clonedElementsWidth - scrollLeft);
            }
        });
    }


    // Başlık ve arka planı güncelleyen fonksiyon
    function updateDisplay(title, background) {
        mainTitle.textContent = title;
        body.style.backgroundImage = `url('images/${background}')`;
    }
});
