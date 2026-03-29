# Ads Setup Guide (Current State)

This guide reflects current working behavior in the repository.

## Current Status

- Ad configuration tables exist in database (`ad_config`, `ad_impressions`).
- Direct visual "Ad Slots" page is not currently exposed in admin sidebar.
- Ad configuration can be managed through backend/database workflows.

## Recommended Working Approaches

## 1. Manage ad records in database

Use Supabase Table Editor or SQL on `ad_config`:

- `slot_name`
- `enabled`
- `ad_code`
- `ad_type` (`adsense`, `affiliate`, `custom`)

Example SQL:

```sql
UPDATE public.ad_config
SET enabled = true,
    ad_type = 'affiliate',
    ad_code = '<a href="https://example.com" target="_blank" rel="noopener sponsored">Offer</a>',
    updated_at = now()
WHERE slot_name = 'banner-top';
```

## 2. Manage through Admin AI Assistant

From `/bosspage` -> AI Assistant section, use natural language tasks such as:

- list ads
- enable/disable a slot
- update ad type/code

The assistant routes these to server-side actions backed by `ad_config`.

## Notes

- Test ad rendering behavior on staging before production rollout.
- Keep third-party scripts minimal to avoid page-performance regressions.
- Use safe HTML and trusted ad providers only.
