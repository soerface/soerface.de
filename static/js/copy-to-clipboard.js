// implement copy to clipboard with visual tooltip indicator
const buttons = document.getElementsByClassName("copy-to-clipboard")
Array.from(buttons).forEach(button => {
    button.className = "btn btn-outline-light btn-sm"
    let rightDistance = "1.5em";
    if (button.parentElement.scrollHeight > button.parentElement.clientHeight)
        rightDistance = "2.5em";
    button.style = "margin: 0.5em; position: absolute; right: " + rightDistance;
    button.title = "Copy to clipboard"
    button.textContent = "Copy"
    button.setAttribute("data-placement", "left")
    $(button).tooltip()
    button.onclick = event => {
        const codeblock = button.parentNode.getElementsByClassName('codehilite')[0]
        let text = codeblock.textContent
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
})
