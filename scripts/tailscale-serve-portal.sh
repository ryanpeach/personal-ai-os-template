#!/usr/bin/env sh
# Expose the portal (host port 4230) over HTTPS at the Tailscale MagicDNS
# hostname. Tailscale provisions and renews the cert automatically.
# Requires "HTTPS Certificates" enabled in the Tailscale admin console
# (https://login.tailscale.com/admin/dns -> "Enable HTTPS").
#
# Idempotent: re-running replaces the existing serve mapping.
set -eu
sudo tailscale serve --bg 4230
sudo tailscale serve status
