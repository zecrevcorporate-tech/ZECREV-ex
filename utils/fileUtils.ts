
declare const JSZip: any;

export const downloadCodeAsZip = async (projectName: string, htmlContent: string) => {
    if (typeof JSZip === 'undefined') {
        console.error('JSZip library is not loaded.');
        alert('Could not download code. JSZip library is missing.');
        return;
    }
    
    try {
        const zip = new JSZip();
        zip.file("index.html", htmlContent);
        
        const content = await zip.generateAsync({ type: "blob" });
        
        const link = document.createElement("a");
        link.href = URL.createObjectURL(content);
        
        const sanitizedName = projectName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        link.download = `${sanitizedName || 'zecoder_project'}.zip`;
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);
    } catch (error) {
        console.error("Failed to create zip file", error);
        alert("An error occurred while creating the zip file.");
    }
};
