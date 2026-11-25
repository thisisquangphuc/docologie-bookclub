# Member security question: Realtime Database rules

The app keeps the selected question and random salt in `member_security_questions/{memberId}`. It keeps only the salted answer hash in `member_security_secrets/{memberId}/answerHash`. The expected hash must not be readable by members. A lobby client submits a candidate hash to `member_security_proofs/{memberId}/{clientId}`; Firebase Rules must accept it only when it matches the stored hash.

There is no Realtime Database rules file in this repository, so this is an integration guide, not a replacement for the live project rules. Merge the conditions below into the existing rules, keeping the existing rules for unrelated features. Do not leave a broad root `.read` or `.write` grant: Firebase rules cascade, so a grant at `/` cannot be revoked by a more restrictive child rule.

Use the already configured admin UID from `assets/js/shared/admin-auth.js` for the admin-only conditions. It is `97RsSwsyj9RGSHjHdDnftbudlhW2`.

```json
{
  "member_security_questions": {
    ".read": true,
    "$memberId": {
      ".write": "auth != null && auth.uid === '97RsSwsyj9RGSHjHdDnftbudlhW2'"
    }
  },
  "member_security_secrets": {
    "$memberId": {
      ".read": "auth != null && auth.uid === '97RsSwsyj9RGSHjHdDnftbudlhW2'",
      ".write": "auth != null && auth.uid === '97RsSwsyj9RGSHjHdDnftbudlhW2'"
    }
  },
  "member_security_proofs": {
    "$memberId": {
      ".read": false,
      "$clientId": {
        ".write": "newData.isString() && root.child('member_security_questions').child($memberId).exists() && newData.val() === root.child('member_security_secrets').child($memberId).child('answerHash').val()"
      }
    }
  }
}
```

The proof write is an online answer check. Keep proof reads denied. Add the same proof condition to the existing member write rules for lobby presence, voting-page presence, and ballots, so a member cannot skip the lobby by opening a voting URL directly. For example, the condition to add to each existing member-owned path is:

```text
root.child('settings').child('requireMemberSecurityQuestion').val() !== true || root.child('member_security_proofs').child($memberId).child($clientId).val() === root.child('member_security_secrets').child($memberId).child('answerHash').val()
```

At `current_ballots/$memberId` and `current_session_presence/$memberId`, use the submitted `newData.child('securityClientId').val()` as `$clientId` in that check. At `lobby_presence/$memberId/$clientId`, use the path's `$clientId`. Adapt the expression to the current path's variables and preserve the existing admin-write branch. Keep the proof nodes private and never add their hash values to public roster or settings data.

Before enabling the setting in the admin UI, deploy the merged rules from Firebase Console → Realtime Database → Rules and verify that:

- a correct answer can create its proof and enter the lobby;
- a wrong answer is denied;
- a member cannot read `member_security_secrets` or `member_security_proofs`;
- a member without a proof cannot create lobby presence or submit a ballot while the setting is on;
- the admin account can create/update questions and hashes.

The question is a light identity check, not strong authentication. A person who knows the answer can still use that member's name, and anyone with direct access to Firebase can attempt guesses. Choose answers that are easy for the member to remember but not obvious from the public roster.
