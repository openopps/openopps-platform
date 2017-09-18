// site-wide javascript utilities

// window opener function
function openWin(winFile,winName,myWidth,myHeight) {
	myPopup = window.open(winFile,winName,'status=no,toolbar=no,scrollbars=yes,width=' + myWidth + ',height=' + myHeight);
}

// window opener function adapted for Edgesuite Flash movie
function openFlashWin(winFile,winName,myWidth,myHeight) {
	myPopup = window.open(winFile,winName,'status=no,toolbar=no,scrollbars=no,width=' + myWidth + ',height=' + myHeight);
}

// Close and move to page
function closeAndMove(targetPage) {
	opener.document.location = targetPage;
	self.close();
}
