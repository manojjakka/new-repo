const MindEase = {
    stress: "low",

    setStress(level) {
        this.stress = level;
    },

    open() {
        alert("AI Chat Opened for " + this.stress + " stress");
    }
};