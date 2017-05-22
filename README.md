# infra-gitbook

以 Discourse 作為協作編輯的平台，再以 Gitbook 作為對外公開的介面

 -  手動安裝 gitbook 在 ubuntu 16.04 上
    - `sudo apt-get install build-essential libssl-dev npm -y`
    - `curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.31.2/install.sh | bash`ls
    - `source ~/.bashrc`
    - `nvm install 7`
    - `sudo npm install -g gitbook-cli`

 -  建立一本新的書 & Run 它
    - `mkdir infra`
    - `cd infra`
    - `gitbook init`
    - `gitbook serve` 

 -  安裝 gitbook 的套件
    - `npm install gitbook-plugin-anchors`
    - `npm install gitbook-plugin-search-pro`
    - 新增 book.json 內容為
    > { "plugins" : [ "-lunr", "-search", "search-pro", "anchors" ] }
