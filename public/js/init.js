$(document).ready(function () {
    // Example HTML content to populate the user_info div
    const userInfoHtml = `
        <p><b> ${user.firstName} ${user.lastName}</b><br/> ${user.email}</p>
    `;

    // Populate the user_info div
    $('#user_info').html(userInfoHtml);

    // Populate entitlements div with floating divs
    // var keyCount = 0;
    // for (const key in entitlements) {
    //     keyCount++;
    //     if (entitlements.hasOwnProperty(key)) {
    //         // Create a wrapper div for the key and its items
    //         const keyWrapperDiv = $(`<div class="entitlement-key-wrapper"></div>`);

    //         // Create a group div for each entitlement key
    //         const groupDiv = $(`<div class="entitlement-group">${key.charAt(0).toUpperCase() + key.slice(1).toLowerCase()}</div>`);

    //         // Add individual items as floating divs
    //         let item_container = "<div class'item-container'>"
           
            
    //         entitlements[key].forEach(item => {
    //             const itemDiv = `<div class="entitlement-item var${keyCount}"><p>${item.toUpperCase()}</p></div>`;
    //             item_container+=itemDiv;
    //         });
    //         item_container+="</div>";
            
    //         // Append the group div to the key wrapper div
    //         keyWrapperDiv.append(groupDiv);
    //         keyWrapperDiv.append(item_container);
    //         // Append the key wrapper div to the entitlements element
    //         $('#entitlements').append(keyWrapperDiv);
    //     }
    // }
   
            // Define specific accesses for each role
            const roleAccesses = {
                'payable': ['credit', 'payment'],
                'purchase': ['cancel', 'purchase', 'return'],
                'Software Dev': ['create_feature_branche', 'view_build_status'],
                'DevOps Engineering': ['deploy_code_to_prod', 'manage_prod_environment', 'modify_deployment_pipelines','restart_prod_services']
            };

            // Function to create role div
            let count = 0;
            function createRoleDiv(role, accesses) {
                
                const roleDiv = $('<div>').addClass("role-div");
                
                // Create role title
                const roleTitle = $('<div>').addClass('role-title');
                
                // Create role value
                let targetclass = 'role-value';
                if(count>0)
                    targetclass = 'role-value2';
                const roleValue = $('<div>').addClass(targetclass).text(role);
                
                let targetclass2 = 'access-container';
                if(count>0)
                    targetclass2 = 'access-container2';
                // Create access container
                const accessContainer = $('<div>').addClass(targetclass2);
                const accessTitle = $('<div>').addClass('access-title').text('Access Permissions:');
                const accessList = $('<div>').addClass('access-list');
                
                // Add access items
                accesses.forEach(function(access) {
                    const accessItem = $('<span>').addClass('access-item').text(access);
                    accessList.append(accessItem);
                });
                
                // Assemble the structure
                accessContainer.append(accessTitle, accessList);
                roleDiv.append(roleTitle, roleValue, accessContainer);
                
                return roleDiv;
            }

            // Generate role divs
            entitlements["role"].forEach(function(role) {
                const accesses = roleAccesses[role] || [];
                const roleDiv = createRoleDiv(role, accesses);
                $('#roleContainer').append(roleDiv);
                count++;
            });
});