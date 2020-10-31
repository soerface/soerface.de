---
title: "KeePass2: Working with multiple and shared databases"
teaser: >
    An underrated feature of KeePass2 is its trigger system. It allows a lot of custom behaviour.
    Let's use it to make working with multiple kdbx files enjoyable!
scripts:
    - copy-to-clipboard.js
---

Sometimes I get asked why I still stick to KeePass2 instead of switching to KeePassXC:
well, [it does not support triggers](https://github.com/keepassxreboot/keepassxc/issues/1016). And triggers allow you to
achieve [a lot of things](https://keepass.info/help/kb/trigger_examples.html).

This is our scenario:

- You have a **personal** KeePass database
- You have a second database that is **shared** with others
- You do **NOT** want to **enter multiple passwords** when starting KeePass2
- You do want **reliable synchronization** between devices

## Download example database

Follow this tutorial by downloading the example databases. Place both files in the **same directory**:

- [<i class="fas fa-download"></i> personal.kdbx](personal.kdbx)
- [<i class="fas fa-download"></i> shared.kdbx](shared.kdbx)

The password for `personal.kdbx` is "[correct horse battery staple](https://xkcd.com/936/)".

## Mount a shared storage

Let any tool take care of synchronizing files between different devices. I like to use simple sshfs:

```shell
mkdir ~/shared_storage
sshfs myserver: ~/shared_storage
```

<small>[Keepass2Android](https://play.google.com/store/apps/details?id=keepass2android.keepass2android) supports ssh, too!</small>

Place a copy of `shared.kdbx` at `~/shared_storage/shared.kdbx`.
Never open files in the shared storage directly!
We will use the synchronization feature of KeePass2 to handle conflicts properly.

## Import triggers

The following XML document describes the triggers. Copy it to your clipboard:

<div id="triggersXML" style="height: 10em; overflow: auto; margin: 1em 0; ">
<button title="Copy to clipboard" data-toggle="tooltip" data-placement="left"
        class="btn btn-outline-light btn-sm" style="margin: 1em; position: absolute; right: 2.5em" id="copyToClipboardButton">Copy
</button>
```xml
<?xml version="1.0" encoding="utf-8"?>
<TriggerCollection xmlns:xsd="http://www.w3.org/2001/XMLSchema"
                   xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
	<Triggers>
		<Trigger>
			<Guid>Fydplzl0QEyZnMJCI6LgNg==</Guid>
			<Name>Open other databases from personal.kdbx</Name>
			<Events>
				<Event>
					<TypeGuid>5f8TBoW4QYm5BvaeKztApw==</TypeGuid>
					<Parameters>
						<Parameter>3</Parameter>
						<Parameter>personal.kdbx</Parameter>
					</Parameters>
				</Event>
			</Events>
			<Conditions />
			<Actions>
				<Action>
					<TypeGuid>/UFV1XmPRPqrifL4cO+UuA==</TypeGuid>
					<Parameters>
						<Parameter>{DB_DIR}/shared.kdbx</Parameter>
						<Parameter />
						<Parameter />
						<Parameter>{REF:P@I:B2BEA12CA9A51B41A8B6C47AC4FD0389}</Parameter>
						<Parameter />
						<Parameter>False</Parameter>
					</Parameters>
				</Action>
				<Action>
					<TypeGuid>P7gzLdYWToeZBWTbFkzWJg==</TypeGuid>
					<Parameters>
						<Parameter>personal.kdbx</Parameter>
						<Parameter>0</Parameter>
					</Parameters>
				</Action>
			</Actions>
		</Trigger>
		<Trigger>
			<Guid>I/1X1vS+akicNYt9+CJG3A==</Guid>
			<Name>Sync shared.kdbx on close</Name>
			<TurnOffAfterAction>true</TurnOffAfterAction>
			<Events>
				<Event>
					<TypeGuid>lPpw5bE/QSamTgZP2MNslQ==</TypeGuid>
					<Parameters>
						<Parameter>3</Parameter>
						<Parameter>shared.kdbx</Parameter>
					</Parameters>
				</Event>
			</Events>
			<Conditions>
				<Condition>
					<TypeGuid>y0qeNFaMTJWtZ00coQQZvA==</TypeGuid>
					<Parameters>
						<Parameter>%HOME%/shared_storage/shared.kdbx</Parameter>
					</Parameters>
					<Negate>false</Negate>
				</Condition>
			</Conditions>
			<Actions>
				<Action>
					<TypeGuid>P7gzLdYWToeZBWTbFkzWJg==</TypeGuid>
					<Parameters>
						<Parameter>shared.kdbx</Parameter>
						<Parameter>0</Parameter>
					</Parameters>
				</Action>
				<Action>
					<TypeGuid>Iq135Bd4Tu2ZtFcdArOtTQ==</TypeGuid>
					<Parameters>
						<Parameter>%HOME%/shared_storage/shared.kdbx</Parameter>
						<Parameter />
						<Parameter />
					</Parameters>
				</Action>
			</Actions>
		</Trigger>
	</Triggers>
</TriggerCollection>
```
</div>

Import the triggers via "Tools -> Triggers...", click on the lower left button "Tools" and select "Paste Triggers from Clipboard".

<video width="100%" autoplay loop muted>
    <source src="keepass-import-triggers.mp4" type="video/mp4">
</video>

## Try it!

Open `personal.kdbx` with the password *"correct horse battery staple"*. It will automatically open `shared.kdbx` in a second tab.

Activate the first tab (`personal.kdbx`). Close KeePass.
It will automatically sync `shared.kdbx` with `$HOME/shared_storage/shared.kdbx`.

When you open it again, it will ask for the password of `personal.kdbx`.

<video width="100%" autoplay loop muted>
    <source src="keepass-trigger-demo.mp4" type="video/mp4">
</video>

## Tweaking it to your needs

To use it for your own databases, you need to change a couple of things:

### Opening a database other than `shared.kdbx`

1. Create an entry in your personal database which contains the password of your shared database
2. After saving the entry, copy it's **UUID**. You can find it in the *"Properties"* tab
3. Edit the trigger *"Open other databases from personal.kdbx"*
4. Select the tab *"Actions"*
5. Edit *"Open database file"*
    - *File/URL* must contain the correct path
    - Password must contain a **[reference](https://keepass.info/help/base/fieldrefs.html#syntax)** to
      the password field in your personal.kdbx database. Replace **B2B...389** with the **UUID** of your
      password entry.
      
### Syncing a database other than `~/shared_storage/shared.kdbx`

1. Edit or copy the trigger *"Sync shared.kdbx on close"*
2. In all three tabs (*Events*, *Conditions*, *Actions*) you must change `shared.kdbx` to the name of your database file

### Using a database name other than `personal.kdbx`

This isn't necessary, but you may prefer to call your database something else. If you do, follow these steps:

1. Edit the trigger *"Open other databases from personal.kdbx"*
2. Select the tab *"Events"*
3. Change the *File/URL* comparison to fit your needs
4. Select the tab "Actions"
5. Change *"Activate database (select tab)"* to the name of your database


## Caveats

- Before closing KeePass, always select your personal database first.
  The next time you open KeePass, it will ask for the password of your personal database.
- When opening multiple databases, make sure to use *"Activate database (select tab)"* after
  you have opened a database to **switch back** to your personal database. Otherwise, the newly
  opened database will be active.
  [References](https://keepass.info/help/base/fieldrefs.html#syntax) always refer to the
  active database!
- When syncing with multiple databases on close, you may also need to **switch back** to the
  personal database after you synced another one. The behaviour which tab gets selected is
  a bit clunky.