# Installation Server

## Raspberry PI

### Vorraussetzungen

-   GIT `sudo apt-get install git`
-   CUPS <https://www.elektronik-kompendium.de/sites/raspberry-pi/2007081.htm>
    -   im Browser unter `127.0.0.1:631` CUPS konfigurieren (Login gleich wie Raspberry):
        gewünschten Drucker als `Alarmdrucker` (Name) einrichten;
-   NodeJS 14 <https://www.w3schools.com/nodejs/nodejs_raspberrypi.asp>
-   Tesseract `sudo apt-get install tesseract-ocr`
    -   (Test mit: `tesseract -v`)
-   Ghostscript `sudo apt-get install ghostscript`

## Faxeingang

-   Faxeingang über Fritzbox - Email:
    1. Fritzbox Konfiguration Faxweiterleitung zu Email
    2. Konfiguration Email Alarmeingang
-   Faxeingang über Fritzbox - Datei:
    -   siehe <https://strobelstefan.org/?p=5405>
    -   siehe:
        <https://forum-raspberrypi.de/forum/thread/40061-netzwerkfreigabe-mounten-mit-systemd-mount-unit/>
-   Faxeingang über USB Faxmodem: siehe <https://wiki.ubuntuusers.de/HylaFAX/>

## Installation Server

1. Aktuelle Versions Datei unter Releases herunterladen, extrahieren
   (<https://github.com/Retschga/FWmonitor/releases>)
2. In Konsole

-   `cd "FWmonitor"`
-   `sudo npm install --production`
-   `sudo npm i puppeteer`
-   `npm install pm2@latest -g`

## Einstellungen bearbeiten

-   [Einstellungen Server](Einstellungen_Server.md)

## Programmstart (manuell)

-   `sudo ./start_ueberwacht.sh`

## Programmstart (automatisch)

-   `sudo crontab -e`
-   `@reboot PFAD_ZU_FWMONITOR/start_ueberwacht.sh` hinzufügen

### Befehle

-   pm2 stop FWmonitorV3
-   pm2 start FWmonitorV3
-   pm2 delete FWmonitorV3
-   pm2 status
