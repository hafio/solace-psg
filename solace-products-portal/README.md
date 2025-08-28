# Solace Products Portal Download Script

This script uses `curl` and `wget` to access and download files from https://products.solace.com. This is useful if the bastion host doesn't have a GUI to access the portal to download files.

## Usage
```
Usage: ./get-solace-files.sh [OPTIONS]

Helper script to download files from https://products.solace.com via curl and wget (both are required).
If the options are not provided, the script will prompt for the values.

OPTIONS:
  --user <username>: specify the portal login username.
  --pass <password>: specify the portal login password.
  --path <path>: specify the full filepath of the file to be downloaded (everything after https://products.solace.com/)
  --cookie <cookie>: specify the previous cookie to be reused.
                     If this option is specified, <user> and <pass> will be ignored.

```