#!/bin/bash
# FWmonitor Auto - Automatischer Wlan-Wechsler sobald Wlan in Reichweite ist
# Achtung: Wlan Zugangsdaten müssen in /etc/wpa_supplicant/wpa_supplicant.conf eingetragen sein
# Beispielaufruf cron: * * * * * autoSwitchWlan.sh WLAN_SSID
# Für Raspian/Raspberry OS mit GUI
# (c) 2020 Johannes Resch
# Version 1.0

# Prüfen ob Script als root ausgeführt wird
if [ "$(id -u)" != "0" ]; then
    echo "#    This script must be run as root." 1>&2
    exit 1
fi

# Prüfe ob 1. Prio SSID übergeben wurde
if [[ $# -lt 1 ]] ; then
    echo "# Aufruf: skript.sh WLAN_SSID"
    exit 1
fi

# Prüfe, ob bereit mit Wlan verbunden
if iwgetid | grep -q "$1"; then
  echo "WLAN bereits verbunden!"
  exit 0
fi

# Prüfe ob Wlan verfügbar ist
if iwlist wlan0 scan | grep -q "$1"; then
  echo "WLAN verfügbar -> Wechseln"
  systemctl restart dhcpcd
  /sbin/dhclient -v -r
  /sbin/ifconfig 'wlan0' down
  sleep 5
  /sbin/ifconfig 'wlan0' up
  /sbin/dhclient -r
fi
