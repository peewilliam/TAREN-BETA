class LoadingScreen {
    constructor() {
        this.element = null;
        this.message = 'Carregando...';
        this.isVisible = true;
    }

    create() {
        // Criar elemento de loading
        this.element = document.createElement('div');
        this.element.id = 'loading-screen';
        
        // Criar spinner
        const spinner = document.createElement('div');
        spinner.className = 'spinner';
        this.element.appendChild(spinner);
        
        // Criar mensagem de loading
        const messageElement = document.createElement('div');
        messageElement.textContent = this.message;
        this.element.appendChild(messageElement);
        
        // Adicionar ao DOM
        document.body.appendChild(this.element);
    }

    setMessage(message) {
        this.message = message;
        if (this.element) {
            const messageElement = this.element.querySelector('div:not(.spinner)');
            if (messageElement) {
                messageElement.textContent = message;
            }
        }
    }

    hide() {
        if (this.element && this.isVisible) {
            this.element.style.opacity = '0';
            this.element.style.transition = 'opacity 0.5s';
            
            setTimeout(() => {
                this.element.style.display = 'none';
                this.isVisible = false;
            }, 500);
        }
    }

    show() {
        if (this.element && !this.isVisible) {
            this.element.style.display = 'flex';
            setTimeout(() => {
                this.element.style.opacity = '1';
                this.isVisible = true;
            }, 10);
        }
    }

    destroy() {
        if (this.element) {
            this.element.remove();
            this.element = null;
        }
    }
}

export const loadingScreen = new LoadingScreen(); 