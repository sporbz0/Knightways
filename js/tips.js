// Listen for the form submission
document.getElementById('tipForm').addEventListener('submit', function(e) {
    e.preventDefault(); // Prevent the form from refreshing the page

    // Get the values from the form
    const tipText = document.getElementById('tipText').value;
    const tipCategory = document.getElementById('tipCategory').value;

    // Create a new list item
    const newTip = document.createElement('li');
    newTip.textContent = tipText;

    // Append the new tip to the corresponding category
    if (tipCategory === 'general') {
        document.getElementById('generalTipsList').appendChild(newTip);
    } else if (tipCategory === 'transportation') {
        document.getElementById('transportationTipsList').appendChild(newTip);
    } else if (tipCategory === 'study') {
        document.getElementById('studyTipsList').appendChild(newTip);
    }

    // Clear the form fields
    document.getElementById('tipText').value = '';
    document.getElementById('tipCategory').value = 'general';
});
