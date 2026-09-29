const canvas = document.getElemenetByID('gameCanvas');
// const canvas = ...: gameCanvas ID'li <canvas> HTML 
// elemanını bulup canvas adında bir değişkene atar (üzerinde çalışacağımız tuvali seçer).
//document.getElementById('gameCanvas'): Sayfadaki ID'si 'gameCanvas' olan elemanı yakalayan JavaScript metodudur.
const ctx = canvas.getContext('2d');
// const ctx = ...: Çizim yapmayı sağlayacak olan bağlamı (context) alır ve ctx değişkenine kaydeder.
// canvas.getContext('2d'): Tuvale iki boyutlu (2D) çizim yapacağını bildirir; dikdörtgen, çizgi, daire veya resim çizmeye yarayan tüm fonksiyonları (adeta bir "çizim fırçası") ctx içine yükler.

let wordsList = [];
let gameRunning = false;
let currentWordIndex = 0;

// Kedi ve Engel nesneleri
const cat = { x:50, y: 300, width: 40, height: 40, color: '#ff80ab' };
const obstacle = {x: 800, y: 300, width: 30, height: 40, color: '#7b1fa2'};
// ------ 1. CSV Dosyasını Yükleme Fonksiyonu -----
async function loadCSV() {
    //Bu kod, arka planda kelimeler.csv dosyasını indirip içeriğini düz metin olarak okur.
    // async function loadCSV() {: Fonksiyonun asenkron (arka planda, sayfayı dondurmadan çalışan) bir fonksiyon olduğunu ve içinde await kullanılabileceğini belirtir.
    try{
        const response = await fetch('kelimeler.csv');
        const data = await response.text();
    //try {: "Bu kodları çalıştırmayı dene, hata çıkarsa yakala" diyerek hata yönetimi bloğunu başlatır.
    // await fetch('kelimeler.csv'): kelimeler.csv dosyasını sunucudan ister; await ise dosya tamamen inene kadar kodun bu satırda beklemesini sağlar.
    // const response = ...: Sunucudan gelen ham yanıt paketini değişkene kaydeder.
    // await response.text(): Gelen yanıtın gövdesini düz metin (string) formatına çevirir ve işlem bitene kadar bekler.
    // const data = ...: Okunan metin verisini (CSV'nin tüm satırlarını) data değişkenine atar.
        // Satırları ayır ve başlık kısmını atla 
        const lines = data.split('\n').map(line => line.trim()).filter(line=> line.length > 0);
        // Bu satır, CSV metnini satır satır ayırıp, gereksiz boşlukları temizler ve tamamen boş satırları eler.
        // data.split('\n'): Tüm metni alt satıra geçme karakterlerinden (\n) bölerek her satırı bir dizi (array) elemanı yapar.
        // .map(line => line.trim()): Her bir satırın başındaki ve sonundaki görünmez boşlukları (trim) temizler.
        // .filter(line => line.length > 0): Karakter uzunluğu 0'dan büyük olanları tutar; yani tamamen boş satırları çöpe atar.
        // const lines = ...: Elde edilen temiz, dolu satırlardan oluşan diziyi lines değişkenine kaydeder.
        
        for (let i=1; i< lines.lenght; i++){
            const [english, turkish, opt1, opt2, opt3] = lines[i].split(',');
            if (english && turkish){
                wordsList.push({
                    en: english,
                    tr: turkish,
                    options: [opt1, opt2, opt3]
                });
            }
        }

        // ---- Kelimeleri Karıştır (shuffle)-----
        wordsList.sort(() => Math.random() - 0.5);
        // Dizideki elemanları verilen kurala göre yeniden sıralayan JavaScript metodudur.
        // Math.random(): 0 ile 1 arasında rastgele ondalıklı bir sayı üretir (örn: 0.72 veya 0.18).
        // - 0.5: Üretilen sayıdan 0.5 çıkararak sonucun bazen pozitif (sayı > 0.5 ise) bazen de negatif (sayı < 0.5 ise) çıkmasını sağlar.
        // () => ...: Sıralama kuralıdır; sort metodu pozitif değer alınca elemanların yerini değiştirir, 
        // negatif alınca dokunmaz. Sonuç sürekli rastgele değiştiği için liste tamamen karışmış olur.
        
        // ----- Yükleme bittiğinde oyunu başlat-----
        gameRunning = true;
        gameLoop();
    }   catch (error){
        console.error("CSV dosyası yüklenirken hata oluştu:", error)
    }
}

function draw(){
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Tuvalin tamamını siler/temizler; önceki kareden 
    // kalan görüntüleri yok ederek animasyonun üst üste binmesini önler (tahtayı silmek gibidir).


    //-------- Zemin -----------
    ctx.fillStyle = '#81c784';
    //ctx.fillStyle = '#81c784';: Çizim fırçasının dolgu rengini açık yeşil yapar. 
    ctx.fillRect(0, 340, canvas.width, 60);
    // ctx.fillRect(0, 340, canvas.width, 60);: İçi dolu bir zemin dikdörtgeni çizer
    // 0: Sol baştan başlar ($X = 0$).
    // 340: Yukarıdan 340 piksel aşağıdan başlar ($Y = 340$).
    // canvas.width: Tuvalin tüm genişliği boyunca uzanır.
    // 60: Yüksekliği 60 pikseldir.

    // ------- Kedi ----------------
    ctx.fillStyle= cat.color;
    ctx.fillRect(cat.x, cat.y, cat.width, cat.height);

    // --------Engel----------
    ctx.fillStyle = obstacle.color;
    ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height );

}

function update(){
    if (!gameRunning) return;

    obstacle.x -=3;
    //Bu kod, oyun aktifken engeli her karede 3 piksel sola doğru kaydırarak hareket ettirir 
    // function update() {: Oyun mekaniklerini, hareketleri ve fizik hesaplarını güncelleyen fonksiyonu başlatır.
    // if (!gameRunning) return;: Oyun durumu kontrolüdür; eğer oyun çalışmıyorsa (gameRunning değeri false ise) 
    // fonksiyondan anında çıkar (return) ve alttaki hareket kodlarını durdurur (oyunu dondurur/duraklatır).
    // obstacle.x -= 3;: Engelin yatay koordinatını her seferinde 3 azaltır (obstacle.x = obstacle.x - 3);
    //  ekranda sol taraf $X = 0$ olduğu için bu işlem engelin sağdan sola doğru akmasını sağlar.

    // -------- Çarpışma Tespiti --------
    if (obstacle.x <= cat.x + cat.width && obstacle.x + obstacle.width >= cat.x ) {
        gameRunning = false;
        showQuiz();
    //Bu kod, kedi ile engelin yatayda çarpışıp çarpışmadığını kontrol eder; çarptıysa oyunu durdurup soru ekranını açar.
    // bilgisayarda çizim yaparken bir nesnenin konumu (x), o nesnenin sol kenarıdır, sağ kenarı değil.
    // Kedinin sağ kenarının nerede bittiğini bulmak için sol kenarına genişliğini eklemek zorundasın:
    // cat.x = Kedinin sol kenarı (örneğin 100)
    // cat.width = Kedinin genişliği (örneğin 50)
    //cat.x + cat.width = Kedinin sağ kenarı ($100 + 50 = 150$)

    }
    if (obstacle.x < -30) {
        obstacle.x = 800;
    }
}

function showQuiz(){
    const quizModal = document.getElementById('quiz-modal');
    //Soru açılır penceresini (modal kutusunu) HTML içinden seçer.

    const wordTitle = document.getElementById('english-word');
    //İngilizce kelimenin yazılacağı başlık alanını HTML içinden yakalar.

    const optionsContainer = document.getElementById('options-container');
    //Şık butonlarının konulacağı kapsayıcı kutuyu seçer.

    const currentData = wordsList[currentWordIndex];
    //Kelime listesinden sıradaki aktif kelimenin verisini (İngilizce, Türkçe ve şıklarını) çeker. 

    wordTitle.innerText = currentData.en;
    //Seçilen kelimenin İngilizce metnini başlık alanına yazar.

    optionsContainer.innerHTML='';
    //Şıklar kutusunun içini tamamen boşaltır; önceki sorudan kalan eski butonları temizleyerek yeni şıklara yer açar.
}

function checkAnswer(selected, correct) {
    const quizModal = document.getElementById('quiz-modal');

    if (selected === correct){
        //if (selected === correct) {: Tıklanan şıkkın (selected) doğru cevaba (correct) eşit olup olmadığını kontrol eder.
        quizModal.classList.add('hidden');
        //quizModal.classList.add('hidden');: Quiz penceresine 'hidden' sınıfını ekleyerek onu ekrandan gizler/kapatır.
        obstacle.x = 800 + Math.random() * 150;
        // Engeli ekranın sağ dışına (800 ile 950 piksel arasına rastgele bir yere) geri ışınlar.
        currentWordIndex = (currentWordIndex + 1) % wordsList.length;
        //Sıradaki kelimeye geçer; liste bittiğinde % (mod) sayesinde hata vermeden listenin en başına (0'a) döner.
        gameRunning = true;
        //Oyunun çalışma durumunu tekrar aktif eder.
        gameLoop();
        // Durmuş olan oyun döngüsünü yeniden başlatarak animasyon ve kontrolleri devam ettirir.
    } else{
        alert("Yanlış cevap, tekrar dene");
    }
}
function gameLoop() {
    if (gameRunning){
        update();
        draw();
        requestAnimationFrame(gameLoop);
    }
}
// Oyunu ve CSV yüklemesini başlat
loadCSV();
