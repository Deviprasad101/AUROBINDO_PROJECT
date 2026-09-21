const unitData = {
    "U-XV": {},
    "HCL-iV": {},
    "Unit-VII": {
        "UNITS APL HC-01": {},
        "UNITS APL HC-03": {}
    },
    "Unit XII": {},
    "Unit-III": {}
};

document.addEventListener('DOMContentLoaded', () => {
    const treeContainer = document.getElementById('tree-container');
    renderTree(treeContainer, unitData);
    
    const rootNode = document.querySelector('.root-node');
    if (rootNode) {
        const childrenWrapper = rootNode.nextElementSibling;
        if (childrenWrapper && childrenWrapper.classList.contains('tree-children')) {
            rootNode.setAttribute('aria-expanded', 'true');
            childrenWrapper.classList.add('expanded');
        }
        handleNodeSelection(rootNode, 'UNITS');
    }
});

function renderTree(container, data) {
    const rootUl = document.createElement('ul');
    rootUl.className = 'tree';
    
    const rootLi = document.createElement('li');
    
    const rootNode = document.createElement('div');
    rootNode.className = 'tree-node root-node';
    rootNode.setAttribute('role', 'treeitem');
    rootNode.setAttribute('tabindex', '0');
    rootNode.setAttribute('aria-expanded', 'false');
    
    rootNode.innerHTML = `
        <i class="node-icon fa-solid fa-building"></i>
        <span class="node-text">UNITS</span>
        <i class="expand-icon fa-solid fa-chevron-right"></i>
    `;
    
    const childrenWrapper = document.createElement('div');
    childrenWrapper.className = 'tree-children'; 
    
    const childrenUl = document.createElement('ul');
    childrenUl.className = 'tree-group';
    
    buildNodes(data, childrenUl);
    
    childrenWrapper.appendChild(childrenUl);
    
    rootLi.appendChild(rootNode);
    rootLi.appendChild(childrenWrapper);
    rootUl.appendChild(rootLi);
    
    container.appendChild(rootUl);
    
    setupNodeInteraction(rootNode, childrenWrapper, 'UNITS');
}

function buildNodes(data, parentUl) {
    for (const [key, value] of Object.entries(data)) {
        const li = document.createElement('li');
        const hasChildren = Object.keys(value).length > 0;
        
        const node = document.createElement('div');
        node.className = 'tree-node';
        node.setAttribute('role', 'treeitem');
        node.setAttribute('tabindex', '0');
        
        let iconClass = 'fa-solid fa-cube';
        if (hasChildren) iconClass = 'fa-regular fa-folder-open';
        else if (key.includes('HC-')) iconClass = 'fa-solid fa-file-invoice';
        
        let expandIconHTML = hasChildren ? `<i class="expand-icon fa-solid fa-chevron-right"></i>` : '';
        
        if (hasChildren) {
            node.setAttribute('aria-expanded', 'false');
        }
        
        node.innerHTML = `
            <i class="node-icon ${iconClass}"></i>
            <span class="node-text">${key}</span>
            ${expandIconHTML}
        `;
        
        li.appendChild(node);
        
        if (hasChildren) {
            const childrenWrapper = document.createElement('div');
            childrenWrapper.className = 'tree-children';
            
            const childrenUl = document.createElement('ul');
            childrenUl.className = 'tree-group';
            
            buildNodes(value, childrenUl);
            
            childrenWrapper.appendChild(childrenUl);
            li.appendChild(childrenWrapper);
            
            setupNodeInteraction(node, childrenWrapper, key);
        } else {
            setupNodeInteraction(node, null, key);
        }
        
        parentUl.appendChild(li);
    }
}

function setupNodeInteraction(node, childrenWrapper, unitName) {
    node.addEventListener('click', (e) => {
        e.stopPropagation();
        
        handleNodeSelection(node, unitName);
        
        if (childrenWrapper) {
            const isExpanded = node.getAttribute('aria-expanded') === 'true';
            
            if (isExpanded) {
                node.setAttribute('aria-expanded', 'false');
                childrenWrapper.classList.remove('expanded');
            } else {
                node.setAttribute('aria-expanded', 'true');
                childrenWrapper.classList.add('expanded');
            }
        }
    });

    node.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            node.click();
        }
    });
}

function handleNodeSelection(selectedNode, unitName) {
    document.querySelectorAll('.tree-node').forEach(node => {
        node.classList.remove('active');
        node.setAttribute('aria-selected', 'false');
    });
    
    selectedNode.classList.add('active');
    selectedNode.setAttribute('aria-selected', 'true');
    
    updateContentArea(unitName);
}

function updateContentArea(unitName) {
    const contentArea = document.getElementById('unit-details');
    const contentTitle = document.getElementById('content-title');
    const contentBody = document.getElementById('content-body');
    
    contentArea.style.opacity = '0';
    
    setTimeout(() => {
        contentTitle.textContent = unitName;
        
        if (unitName === 'UNITS') {
            contentBody.innerHTML = `
                <div class="analytics-card">
                    <h3>Enterprise Overview</h3>
                    <p style="color: var(--text-muted); margin-bottom: 24px;">Select a specific unit from the tree structure to view detailed operational analytics.</p>
                    <div class="metrics-grid">
                        <div class="metric">
                            <span class="metric-label">Total Units</span>
                            <span class="metric-value">5</span>
                        </div>
                        <div class="metric">
                            <span class="metric-label">System Status</span>
                            <span class="metric-value" style="color: #10b981;">Online</span>
                        </div>
                    </div>
                </div>
            `;
        } else {
            const production = Math.floor(Math.random() * 5000) + 8000;
            const efficiency = (Math.random() * 10 + 88).toFixed(1);
            
            contentBody.innerHTML = `
                <div class="analytics-card">
                    <h3>${unitName} Analytics Report</h3>
                    <div class="metrics-grid">
                        <div class="metric">
                            <span class="metric-label">Monthly Production</span>
                            <span class="metric-value">${production.toLocaleString()}</span>
                        </div>
                        <div class="metric">
                            <span class="metric-label">Operational Efficiency</span>
                            <span class="metric-value">${efficiency}%</span>
                        </div>
                        <div class="metric">
                            <span class="metric-label">Active Alerts</span>
                            <span class="metric-value" style="color: #ef4444;">${Math.floor(Math.random() * 4)}</span>
                        </div>
                    </div>
                    <div class="chart-placeholder">
                        <i class="fa-solid fa-chart-line"></i>
                        <p>Excel Data Visualization Area</p>
                        <small style="color: var(--text-muted);">Data source pending connection</small>
                    </div>
                </div>
            `;
        }
        
        contentArea.style.opacity = '1';
    }, 250);
}
