let triggersXMLBox = document.getElementById('triggersXML').getElementsByClassName('codehilite')[0]

// implement copy to clipboard with visual tooltip indicator
$('#copyToClipboardButton').tooltip()
document.getElementById('copyToClipboardButton').onclick = event => {
    let text = triggersXMLBox.textContent;

    if (!navigator.clipboard) {
        // this fallback only works if triggersXMLBox would be an input field.
        // But as far as I remember, the fallback is only necessary on mobile - and for mobile, this article
        // is less relevant, so probably I won't need to bother about mobile support
        // try {
        //     triggersXMLBox.focus();
        //     triggersXMLBox.select();
        //     let successful = document.execCommand('copy');
        //     if (successful) {
        //         $(event.target).attr('title', 'Copied!').tooltip('show');
        //         $(event.target).attr('data-original-title', 'Copied!').tooltip('show');
        //         $(event.target).attr('title', 'Copy to clipboard');
        //         $(event.target).attr('data-original-title', 'Copy to clipboard');
        //     }
        // } catch (err) {
            console.error('Unable to copy to clipboard', err);
        // }
        return
    }

    navigator.clipboard.writeText(text).then(() => {
        $(event.target).attr('title', 'Copied!').tooltip('show');
        $(event.target).attr('data-original-title', 'Copied!').tooltip('show');
        $(event.target).attr('title', 'Copy to clipboard');
        $(event.target).attr('data-original-title', 'Copy to clipboard');
    })
}