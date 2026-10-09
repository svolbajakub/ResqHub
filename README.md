# ResqHub

Rozcestník mini aplikací pro telefon. Běží na GitHub Pages, dá se přidat na plochu jako aplikace a funguje i offline.

## Co je ve složce

```
index.html          rozcestník (hub)
lock.js             zamykání aplikací heslem
admin.html          správa – ikony, názvy, popisy, pořadí, publikování
apps.js             seznam aplikací (generuje správa)
style.css, common.js  sdílený vzhled a logika
manifest.json, sw.js  instalace na plochu a offline režim
icons/              ikona ResqHubu
apps/ukazka/        ukázková mini aplikace (klidně smaž)
```

## 1. Nasazení na GitHub Pages

1. Na GitHubu vytvoř nový repozitář, třeba `resqhub`.
2. Nahraj do něj **obsah** této složky (ne složku samotnou), aby `index.html` ležel v kořeni repozitáře.
3. V repozitáři otevři **Settings → Pages**, u *Source* zvol **Deploy from a branch**, větev `main`, složku `/ (root)` a ulož.
4. Za minutu dvě poběží hub na `https://tvoje-jmeno.github.io/resqhub/`.

## 2. Přidání na plochu telefonu

- **iPhone:** otevři adresu v Safari → tlačítko Sdílet → **Přidat na plochu**.
- **Android:** otevři v Chrome → menu ⋮ → **Instalovat aplikaci** (nebo Přidat na plochu).

Po prvním spuštění se hub i všechny aplikace stáhnou do telefonu a pak fungují i bez signálu.

## 3. Připojení správy ke GitHubu (jednou)

Aby šlo publikovat přímo z telefonu, potřebuje správa token:

1. GitHub → profilová fotka → **Settings → Developer settings → Personal access tokens → Fine-grained tokens → Generate new token**.
2. *Repository access*: **Only select repositories** → vyber `resqhub`.
3. *Permissions → Repository permissions → Contents*: **Read and write**.
4. Vygeneruj a zkopíruj token.
5. Správu otevřeš zadáním adresy hubu s `admin.html` na konci, třeba `https://tvoje-jmeno.github.io/ResqHub/admin.html`. V hubu na ni žádný odkaz není. Ulož si ji do záložek. Při prvním otevření si nastav heslo ke správě. Pak v sekci *Připojení ke GitHubu* vlož token a dej **Ověřit připojení**. Uživatel a repozitář se na GitHub Pages doplní samy.

Token zůstává uložený jen v prohlížeči daného telefonu, nikam se neodesílá kromě GitHubu.

## 4. Přidání aplikace

**Jednosouborová aplikace (jeden .html):**
Správa (`…/admin.html`) → Přidat aplikaci → vyplň název a popis → Vybrat ikonu → **Nahrát HTML soubor na GitHub…** → Hotovo → **Publikovat na GitHub**.

**Aplikace s více soubory (obrázky, CSS, JS):**
Nahraj ji na GitHub do vlastní složky, třeba `apps/kalkulacka/`, a ve správě zadej cestu `apps/kalkulacka/index.html`.

Změny ve správě se nejdřív ukládají jako *koncept* jen v tom telefonu (hub ho hned ukazuje s upozorněním). Ostatním zařízením se projeví po publikování, GitHub Pages je nasadí obvykle do 1–3 minut.

**Bez tokenu:** ve správě dej *Stáhnout apps.js* a nahraj ho na GitHub místo starého.

## 5. Zamčení aplikace heslem

1. Ve správě otevři aplikaci a zapni **Zamknout heslem**.
2. Zadej heslo (aspoň 8 znaků) a dej **Zašifrovat a nahrát HTML soubor**. Vyber HTML soubor aplikace.
3. Dej **Uložit** a **Publikovat**.

Soubor se zašifruje přímo v telefonu (AES-256) ještě před nahráním. Na GitHubu je jen nečitelný obsah a heslo se neukládá nikam, ani do správy, ani do repozitáře. Dlaždice dostane zámek a po otevření se zeptá na heslo, telefon si ho může zapamatovat.

- **Zapomenuté heslo nejde obnovit.** Aplikaci prostě nahraj znovu s novým heslem.
- Funguje pro aplikace z **jednoho HTML souboru**. Obrázky vlož přímo do HTML, soubory vedle by zůstaly veřejné.
- Název, popis a ikona zamčené aplikace zůstávají v hubu viditelné.
- Odemčení: vypni přepínač a nahraj soubor znovu bez hesla.

## Tipy

- Názvy souborů a složek piš **malými písmeny, bez mezer a diakritiky**. GitHub rozlišuje velikost písmen, telefon a počítač často ne.
- Odkazy uvnitř mini aplikací piš relativně (`obrazek.png`, ne `/obrazek.png`).
- Všechny aplikace sdílí úložiště prohlížeče (localStorage). Používej v nich klíče s předponou, třeba `kalkulacka:nastaveni`, ať si nepřepisují data.
- Volba *Otevírat uvnitř hubu* zobrazí nad aplikací lištu „‹ ResqHub“. Na iPhonu v režimu z plochy jinak tlačítko zpět chybí.
- Když změníš samotný hub (`index.html`, `style.css`…), zvyš v `sw.js` číslo `VERSION`, ať si telefony stáhnou novou verzi.
- **Správa** se otevírá jen ručně zadanou adresou `…/admin.html`. Je chráněná heslem, kterým se v telefonu šifruje i token. Zapomenuté heslo: *Zapomněl jsem heslo* smaže uložené připojení, token pak vložíš znovu. Aplikace ani hub se tím nezmění.
- Skutečnou ochranou proti cizím úpravám je token. Bez něj nikdo nic nepublikuje, ani kdyby se do správy dostal.
