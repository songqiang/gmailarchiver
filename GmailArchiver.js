/**
 * Main function run at spreadsheet opening
 */
function onOpen() {
		var ss = SpreadsheetApp.getActiveSpreadsheet();
		var menuEntries = [ 
    {name: "Initialize", functionName: "init"},
    {name: "Archive Gmail Messages", functionName: "ScanGmail"}
  ];
  ss.addMenu("Gmail Archiver", menuEntries);
}
    
/**
 * Initialize the system
 */
function init() {
    // Create the needed Gmail label
    GmailApp.createLabel("Archive to Drive");
    
    // Create Google Drive folder if doesn't exists
    try {
       var folder = DocsList.getFolder("Email Archive");
    } catch(e) {
       // Folder doesn't exists
       DocsList.createFolder("Email Archive");
    }
    
    Browser.msgBox("Created Gmail label: Archive to Drive and Google Drive folder: Email Archive");
}

/**
 * Scan Gmail account for message archive requests
 */
function ScanGmail() {
  
  // log sender and the attachment name
  var ss = SpreadsheetApp.getActiveSheet();

  // Get the label
  var label = GmailApp.getUserLabelByName("Archive to Drive");
    var threadsArr = getThreadsForLabel(label);
    for(var j=0; j<threadsArr.length; j++) {
      var messagesArr = getMessagesforThread(threadsArr[j]);
      for(var k=0; k<messagesArr.length; k++) {
        var messageId = messagesArr[k].getId();
        var messageDate = Utilities.formatDate(messagesArr[k].getDate(), Session.getTimeZone(), "dd/MM/yyyy - HH:mm:ss");
        var messageFrom = messagesArr[k].getFrom();
        var messageSubject = messagesArr[k].getSubject();
        var messageBody = messagesArr[k].getBody();
        var messageAttachments = messagesArr[k].getAttachments();
        
	if (messageAttachments.length > 0)
	{
        // Create the new folder to contain the message
	  var path = "Email Archive" + "/" + messageFrom;
	  try {
		  var senderFolder = DocsList.getFolder(path);
	  } catch(e) {
		  var senderFolder = DocsList.createFolder(path);
	  }
	}

        // Save attachments
        for(var i = 0; i < messageAttachments.length; i++) {
            var attachmentName = messageAttachments[i].getName();
            var attachmentContentType = messageAttachments[i].getContentType();
            var attachmentBlob = messageAttachments[i].copyBlob();
            senderFolder.createFile(attachmentBlob);
			
			ss.insertRows(2);
			ss.getRange("A2").setValue(messageFrom);
			ss.getRange("B2").setValue(attachmentName);
        }
      }
      // Remove Gmail label from archived thread
      label.removeFromThread(threadsArr[j]);
    }
    Browser.msgBox("Gmail messages successfully archived to Google Drive");
}


/**
 * Find all user's Gmail labels that represent mail message
 * movement requests es: moveto->xx@yyyy.com
 *
 * @return {GmailLabel[]} Array of GmailLabel objects
 */
function scanLabels() {
  // logs all of the names of your labels
  var labels = GmailApp.getUserLabels();
  var results = new Array();
  for (var i = 0; i < labels.length; i++) {
    if(labels[i].getName() == "Archive to Drive") {
      results.push(labels[i]);
    }
  }
  return results;
}

/**
 * Get all Gmail threads for the specified label
 *
 * @param {GmailLabel} label GmailLabel object to get threads for
 * @return {GmailThread[]} an array of threads marked with this label
 */
function getThreadsForLabel(label) {
  var threads = label.getThreads();
  return threads;
}

/**
 * Get all Gmail messages for the specified Gmail thread
 *
 * @param {GmailThread} thread object to get messages for
 * @return {GmailMessage[]} an array of messages contained in the specified thread
 */
function getMessagesforThread(thread) {
  var messages = thread.getMessages();
  return messages;
}


/**
 * Get methods of an object
 * @param {Object} object to scan
 * @return {Array} object's methods
 */
function getMethods(obj) {
  var result = [];
  for (var id in obj) {
    try {
      if (typeof(obj[id]) == "function") {
        result.push(id + ": " + obj[id].toString());
      }
    } catch (err) {
      result.push(id + ": inaccessible");
    }
  }
  return result;
}

/**
 * Create a Google Drive Folder
 *
 * @param {String} baseFolder name of the base folder
 * @param {String} folderName name of the folder
 * @return {Folder} the folder object created representing the new folder 
 */
function createDriveFolder(baseFolder, folderName) {
  var baseFolderObject = DocsList.getFolder(baseFolder);
  return baseFolderObject.createFolder(folderName);
}
