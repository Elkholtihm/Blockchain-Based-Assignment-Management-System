FROM ethereum/client-go:v1.10.26

# Create necessary directories
RUN mkdir -p /root/.ethereum/geth
RUN mkdir -p /root/data

# Copy genesis template
COPY genesis.json /root/genesis.json

# Copy init script
COPY init.sh /root/init.sh
RUN chmod +x /root/init.sh

# Expose ports
EXPOSE 8545 8546 30303

WORKDIR /root

ENTRYPOINT ["/root/init.sh"]